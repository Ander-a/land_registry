import React, { useRef, useEffect, useState } from 'react'
import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet'
import { EditControl } from 'react-leaflet-draw'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import L from 'leaflet'

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

export default function MapBoundaryDrawer({ onBoundaryChange, center = [-1.2921, 36.8219] }) {
  const [drawnItems, setDrawnItems] = useState(null)
  const featureGroupRef = useRef()

  const onCreated = (e) => {
    const { layer } = e
    
    // Clear previous drawings
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers()
    }
    
    // Add new layer
    if (featureGroupRef.current) {
      featureGroupRef.current.addLayer(layer)
    }
    
    // Extract GeoJSON
    const geoJSON = layer.toGeoJSON()
    const boundary = {
      type: 'Polygon',
      coordinates: geoJSON.geometry.coordinates
    }
    
    onBoundaryChange(boundary)
  }

  const onEdited = (e) => {
    const { layers } = e
    layers.eachLayer((layer) => {
      const geoJSON = layer.toGeoJSON()
      const boundary = {
        type: 'Polygon',
        coordinates: geoJSON.geometry.coordinates
      }
      onBoundaryChange(boundary)
    })
  }

  const onDeleted = () => {
    onBoundaryChange(null)
  }

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '400px', width: '100%', marginBottom: '16px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FeatureGroup ref={featureGroupRef}>
        <EditControl
          position="topright"
          onCreated={onCreated}
          onEdited={onEdited}
          onDeleted={onDeleted}
          draw={{
            rectangle: false,
            circle: false,
            circlemarker: false,
            marker: false,
            polyline: false,
            polygon: {
              allowIntersection: false,
              showArea: true,
              shapeOptions: {
                color: '#3388ff'
              }
            }
          }}
        />
      </FeatureGroup>
    </MapContainer>
  )
}
