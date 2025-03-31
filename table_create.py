import pandas as pd
import sqlite3
from pathlib import Path
import os

def create_database():
    # Database path - using absolute path in user's home directory
    db_dir = os.path.expanduser("~/.rasa_data")  # Creates directory in user's home
    os.makedirs(db_dir, exist_ok=True)
    db_path = os.path.join(db_dir, "rasa.db")
    
    print(f"Creating database at: {db_path}")
    
    # Delete existing database if it exists
    if os.path.exists(db_path):
        try:
            os.remove(db_path)
            print("Existing database deleted successfully.")
        except Exception as e:
            print(f"Error deleting old database: {e}")
    
    try:
        # Connect to the SQLite database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        print("Database connection established.")

        # Load and combine property data
        data_dir = Path("/workspaces/Rasa_challenge/realstate_data")
        if not data_dir.exists():
            raise FileNotFoundError(f"Data directory not found at: {data_dir.absolute()}")

        csv_files = {
            "hyderabad": data_dir / "hyderabad.csv",
            "kolkata": data_dir / "kolkata.csv",
            "mumbai": data_dir / "mumbai.csv",
            "gurgaon": data_dir / "gurgaon_10k.csv",
        }
        
        dfs = []
        missing_files = []
        
        for city, file_path in csv_files.items():
            if not file_path.exists():
                missing_files.append(str(file_path))
                continue
                
            try:
                df = pd.read_csv(file_path)
                
                if "city" in df.columns:
                    df.rename(columns={"city": "original_city"}, inplace=True)
                
                df["source_city"] = city
                dfs.append(df)
                print(f"✓ Data loaded from {file_path.name}")
            except Exception as e:
                print(f"⚠ Error processing {file_path.name}: {str(e)}")
        
        if missing_files:
            print(f"\nMissing data files: {', '.join(missing_files)}")
        
        if dfs:
            combined_df = pd.concat(dfs, ignore_index=True)
            combined_df.to_sql("prop_data", conn, if_exists="replace", index=False)
            print("\n✅ Main property table created with", len(combined_df), "records")
        else:
            print("\n❌ No property data processed - check your CSV files")
            return False

        # Load and create facet tables
        facet_dir = data_dir / "facets/facets"
        if not facet_dir.exists():
            raise FileNotFoundError(f"Facets directory not found at: {facet_dir}")

        facet_files = {
            "facets_building_id": "BUILDING_ID.csv",
            "facets_total_floor": "TOTAL_FLOOR.csv",
            "facets_ownership_type": "OWNERSHIP_TYPE.csv",
            "facets_age": "AGE.csv",
            "facets_furnish": "FURNISH.csv",
            "facets_amenities": "AMENITIES.csv",
            "facets_floor_num": "FLOOR_NUM.csv",
            "facets_bathroom_num": "BATHROOM_NUM.csv",
            "facets_property_type": "PROPERTY_TYPE.csv",
            "facets_sub_availability": "SUB_AVAILABILITY.csv",
            "facets_facing_direction": "FACING_DIRECTION.csv",
            "facets_city": "CITY.csv",
            "facets_features": "FEATURES.csv",
            "facets_bedroom_num": "BEDROOM_NUM.csv",
            "facets_locality_id": "LOCALITY_ID.csv",
        }
        
        facet_errors = 0
        for table_name, filename in facet_files.items():
            file_path = facet_dir / filename
            if not file_path.exists():
                print(f"⚠ Missing facet: {filename}")
                facet_errors += 1
                continue
                
            try:
                df = pd.read_csv(file_path)
                df.to_sql(table_name, conn, if_exists="replace", index=False)
                print(f"✓ {table_name.ljust(25)} ({len(df)} records)")
            except Exception as e:
                print(f"⚠ Error processing {filename}: {str(e)}")
                facet_errors += 1
        
        print(f"\nFacets loaded with {facet_errors} errors")

        # Create application tables
        tables = {
            "saved_preferences": """
            CREATE TABLE IF NOT EXISTS saved_preferences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender_id VARCHAR(255) NOT NULL,
                type_name VARCHAR(255) NOT NULL,
                timestamp FLOAT,
                intent_name VARCHAR(255),
                action_name VARCHAR(255),
                data TEXT
            )""",
            
            "favorites": """
            CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id VARCHAR(255) NOT NULL,
                property_id INTEGER NOT NULL,
                filters TEXT,
                timestamp FLOAT,
                UNIQUE(session_id, property_id)
            )""",
            
            "scheduled_visits": """
            CREATE TABLE IF NOT EXISTS scheduled_visits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender_id TEXT,
                property_id TEXT,
                property_address TEXT,
                visit_date TEXT,
                visit_time TEXT,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )"""
        }

        for name, sql in tables.items():
            try:
                cursor.execute(sql)
                print(f"✅ {name} table created")
            except Exception as e:
                print(f"⚠ Failed to create {name} table: {str(e)}")

        # Commit changes
        conn.commit()
        print("\nDatabase setup completed successfully.")
        return True
        
    except Exception as e:
        print(f"\n❌ Critical error: {str(e)}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    success = create_database()
    if not success:
        exit(1)