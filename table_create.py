import pandas as pd
import sqlite3
from pathlib import Path
import os

def create_database():
    # Database path
    db_path = "/rasa_env/rasa.db"
    
    # Delete existing database if it exists
    if os.path.exists(db_path):
        os.remove(db_path)
        print("Database deleted successfully.")
    else:
        print("Database file not found.")
    
    # Connect to the SQLite database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Load and combine property data
    data_dir = Path("realstate_data")
    csv_files = {
        "hyderabad": data_dir / "hyderabad.csv",
        "kolkata": data_dir / "kolkata.csv",
        "mumbai": data_dir / "mumbai.csv",
        "gurgaon": data_dir / "gurgaon_10k.csv",
    }
    
    dfs = []
    for city, file_path in csv_files.items():
        try:
            df = pd.read_csv(file_path)
            
            if "city" in df.columns:
                df.rename(columns={"city": "original_city"}, inplace=True)
            
            df["source_city"] = city
            dfs.append(df)
            print(f"Data from {file_path} read successfully.")
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
    
    if dfs:
        combined_df = pd.concat(dfs, ignore_index=True)
        combined_df.to_sql("prop_data", conn, if_exists="replace", index=False)
        print("Table 'prop_data' created successfully.")
    else:
        print("No data to process.")
    
    # Load and create facet tables
    facet_files = {
        "facets_building_id": data_dir / "facets/facets/BUILDING_ID.csv",
        "facets_total_floor": data_dir / "facets/facets/TOTAL_FLOOR.csv",
        "facets_ownership_type": data_dir / "facets/facets/OWNERSHIP_TYPE.csv",
        "facets_age": data_dir / "facets/facets/AGE.csv",
        "facets_furnish": data_dir / "facets/facets/FURNISH.csv",
        "facets_amenities": data_dir / "facets/facets/AMENITIES.csv",
        "facets_floor_num": data_dir / "facets/facets/FLOOR_NUM.csv",
        "facets_bathroom_num": data_dir / "facets/facets/BATHROOM_NUM.csv",
        "facets_property_type": data_dir / "facets/facets/PROPERTY_TYPE.csv",
        "facets_sub_availability": data_dir / "facets/facets/SUB_AVAILABILITY.csv",
        "facets_facing_direction": data_dir / "facets/facets/FACING_DIRECTION.csv",
        "facets_city": data_dir / "facets/facets/CITY.csv",
        "facets_features": data_dir / "facets/facets/FEATURES.csv",
        "facets_bedroom_num": data_dir / "facets/facets/BEDROOM_NUM.csv",
        "facets_locality_id": data_dir / "facets/facets/LOCALITY_ID.csv",
    }
    
    for table_name, file_path in facet_files.items():
        try:
            df = pd.read_csv(file_path)
            df.to_sql(table_name, conn, if_exists="replace", index=False)
            print(f"Table '{table_name}' created successfully.")
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
    
    # Create saved_preferences table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS saved_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id VARCHAR(255) NOT NULL,
        type_name VARCHAR(255) NOT NULL,
        timestamp FLOAT,
        intent_name VARCHAR(255),
        action_name VARCHAR(255),
        data TEXT
    );
    ''')
    print("Table 'saved_preferences' created successfully.")
    
    # Create favorites table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id VARCHAR(255) NOT NULL,
        property_id INTEGER NOT NULL,
        filters TEXT,
        timestamp FLOAT,
        UNIQUE(session_id, property_id)
    );
    ''')
    print("Table 'favorites' created successfully.")
    
    # Create scheduled_visits table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS scheduled_visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id TEXT,
        property_id TEXT,
        property_address TEXT,
        visit_date TEXT,
        visit_time TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    print("Table 'scheduled_visits' created successfully.")
    
    # Commit changes and close connection
    conn.commit()
    conn.close()
    print("Database setup completed successfully.")

if __name__ == "__main__":
    create_database()