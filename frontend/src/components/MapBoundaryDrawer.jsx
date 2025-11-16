import React, { useRef, useEffect, useState } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
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

function DrawControl({ onBoundaryChange }) {
  const map = useMap()
  const drawnItems = useRef(new L.FeatureGroup())

  useEffect(() => {
    if (!map) return

    map.addLayer(drawnItems.current)

    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
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
      },
      edit: {
        featureGroup: drawnItems.current,
        remove: true
      }
    })

    map.addControl(drawControl)

    map.on(L.Draw.Event.CREATED, (e) => {
      const { layer } = e
      
      // Clear previous drawings
      drawnItems.current.clearLayers()
      
      // Add new layer
      drawnItems.current.addLayer(layer)
      
      // Extract GeoJSON
      const geoJSON = layer.toGeoJSON()
      const boundary = {
        type: 'Polygon',
        coordinates: geoJSON.geometry.coordinates
      }
      
      onBoundaryChange(boundary)
    })

    map.on(L.Draw.Event.EDITED, (e) => {
      const { layers } = e
      layers.eachLayer((layer) => {
        const geoJSON = layer.toGeoJSON()
        const boundary = {
          type: 'Polygon',
          coordinates: geoJSON.geometry.coordinates
        }
        onBoundaryChange(boundary)
      })
    })

    map.on(L.Draw.Event.DELETED, () => {
      onBoundaryChange(null)
    })

    return () => {
      map.removeControl(drawControl)
      map.removeLayer(drawnItems.current)
    }
  }, [map, onBoundaryChange])

  return null
}

export default function MapBoundaryDrawer({ onBoundaryChange, center = [-1.2921, 36.8219] }) {
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
      <DrawControl onBoundaryChange={onBoundaryChange} />
    </MapContainer>
  )
}
