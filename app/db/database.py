from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
import os
from dotenv import load_dotenv
from urllib.parse import quote_plus

load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

safe_password = quote_plus(DB_PASSWORD)

DATABASE_URL = f"postgresql://{DB_USER}:{safe_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL)
Base = declarative_base()