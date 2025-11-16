from typing import Generator
from sqlmodel import SQLModel, create_engine, Session

from .config import settings

# Use a connect_args for psycopg2 if needed
engine = create_engine(settings.DB_URL, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
