from .database import engine, Base
from . import models  

def init_db():
    print("Initializing database...")

    Base.metadata.create_all(bind=engine)

    print("Database initialized successfully.")


# Run to initialize the database when this script is executed directly
if __name__ == "__main__":
    init_db()