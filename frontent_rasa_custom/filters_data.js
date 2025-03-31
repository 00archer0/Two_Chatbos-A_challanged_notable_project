export const filterData = {
    PROPERTY_TYPE: {
        title: "Type of Property",
        type: "chips",
        multiSelect: true,
        options: [
            { name: "Residential Apartment", enabled: false },
            { name: "Independent House/Villa", enabled: false },
            { name: "Residential Land", enabled: false },
            { name: "Independent/Builder Floor", enabled: false },
            { name: "Farm House", enabled: false },
            { name: "Serviced Apartments", enabled: false },
            { name: "Studio Apartment", enabled: false },
            { name: "Other", enabled: false }
        ]
    },
    BEDROOM_NUM: {
        title: "BHK Type",
        type: "chips",
        multiSelect: true,
        options: [
            { name: "1 RK", enabled: false },
            { name: "1 BHK", enabled: false },
            { name: "2 BHK", enabled: false },
            { name: "3 BHK", enabled: false },
            { name: "4 BHK", enabled: false },
            { name: "5 BHK", enabled: false },
            { name: "6 BHK", enabled: false },
            { name: "7 BHK", enabled: false },
            { name: "8 BHK", enabled: false },
            { name: "9 BHK", enabled: false },
            { name: "9+ BHK", enabled: false }
        ]
    },
    BATHROOM_NUM: {
        title: "Number of Bathrooms",
        type: "chips",
        multiSelect: true,
        options: [
            { name: "1+", enabled: false },
            { name: "2+", enabled: false },
            { name: "3+", enabled: false },
            { name: "4+", enabled: false },
            { name: "5+", enabled: false }
        ]
    },
    BUDGET: {
        title: "Budget",
        type: "dualRange",
        options: {
            min: 0,
            max: 9999999,
            step: 10000,
            currentMin: 0,
            currentMax: 9999999,
            labels: ["Min Budget", "Max Budget"]
        }
    },
    AREA_SQFT: {
        title: "Covered Area",
        type: "range",
        options: {
            min: 0,
            max: 4000,
            step: 100,
            currentMin: 0,
            currentMax: 4000,
            labels: ["sq.ft.", "sq.ft."]
        }
    },
    TRANSACT_TYPE: {
        title: "Transaction Type",
        type: "chips",
        multiSelect: true,
        options: [
            { name: "Sale", enabled: false },
            { name: "Rent", enabled: false }
        ]
    },
    AMENITIES: {
        title: "Amenities",
        type: "chips",
        multiSelect: true,
        options: [
            { name: "Swimming Pool", enabled: false },
            { name: "Power Back-up", enabled: false },
            { name: "Club house / Community Center", enabled: false },
            { name: "Feng Shui / Vaastu Compliant", enabled: false },
            { name: "Park", enabled: false },
            { name: "Private Garden / Terrace", enabled: false },
            { name: "Security Personnel", enabled: false },
            { name: "Centrally Air Conditioned", enabled: false },
            { name: "ATM", enabled: false },
            { name: "Fitness Centre / GYM", enabled: false },
            { name: "Cafeteria / Food Court", enabled: false },
            { name: "Bar / Lounge", enabled: false },
            { name: "Conference room", enabled: false },
            { name: "Security / Fire Alarm", enabled: false },
            { name: "Visitor Parking", enabled: false },
            { name: "Intercom Facility", enabled: false },
            { name: "Lift(s)", enabled: false },
            { name: "Service / Goods Lift", enabled: false },
            { name: "Maintenance Staff", enabled: false },
            { name: "Water Storage", enabled: false },
            { name: "Waste Disposal", enabled: false },
            { name: "Rain Water Harvesting", enabled: false },
            { name: "Access to High Speed Internet", enabled: false },
            { name: "Bank Attached Property", enabled: false },
            { name: "Piped-gas", enabled: false },
            { name: "Water purifier", enabled: false },
            { name: "Shopping Centre", enabled: false },
            { name: "WheelChair Accessibility", enabled: false },
            { name: "DG Availability", enabled: false },
            { name: "CCTV Surveillance", enabled: false },
            { name: "Grade A Building", enabled: false },
            { name: "Grocery Shop", enabled: false },
            { name: "Near Bank", enabled: false }
        ]
    },
    AGE: {
        title: "Age of Property",
        type: "chips",
        multiSelect: true,
        options: [
            { name: "1-5 Year Old Property", enabled: false },
            { name: "5-10 Year Old Property", enabled: false },
            { name: "10+ Year Old Property", enabled: false },
            { name: "Under Construction", enabled: false },
            { name: "0-1 Year Old Property", enabled: false }
        ]
    }
};


// export const filterData = {
//     propertyType: {
//         title: "Type of Property",
//         type: "chips",
//         multiSelect: true,
//         options: [
//             { name: "Flat/Apartment", enabled: false },
//             { name: "Independent/Builder Floor", enabled: false },
//             { name: "Independent House/Villa", enabled: false },
//             { name: "1 RK/Studio Apartment", enabled: false },
//             { name: "Farm House", enabled: false },
//             { name: "Serviced Apartments", enabled: false },
//             { name: "Penthouse", enabled: false },
//             { name: "Residential House", enabled: false },
//             { name: "Gated Community Villa", enabled: false },
//             { name: "Other", enabled: false }
//         ]
//     },
//     bhkType: {
//         title: "BHK Type",
//         type: "chips",
//         multiSelect: true,
//         options: [
//             { name: "1 RK", enabled: false },
//             { name: "1 BHK", enabled: false },
//             { name: "2 BHK", enabled: false },
//             { name: "3 BHK", enabled: false },
//             { name: "4 BHK", enabled: false },
//             { name: "5 BHK", enabled: false },
//             { name: "6 BHK", enabled: false },
//             { name: "7 BHK", enabled: false },
//             { name: "8 BHK", enabled: false },
//             { name: "9 BHK", enabled: false },
//             { name: "9+ BHK", enabled: false }
//         ]
//     },
//     budget: {
//         title: "Budget / Rent Range",
//         type: "dualRange",
//         options: {
//             min: 0,
//             max: 1000000,
//             step: 10000,
//             currentMin: 0,
//             currentMax: 1000000,
//             labels: ["Min Budget", "Max Budget"]
//         }
//     },
//     coveredArea: {
//         title: "Covered Area (sq.ft.)",
//         type: "range",
//         options: {
//             min: 0,
//             max: 4000,
//             step: 100,
//             currentMin: 0,
//             currentMax: 4000
//         }
//     },
//     possessionStatus: {
//         title: "Possession Status",
//         type: "chips",
//         multiSelect: true,
//         options: [
//             { name: "Ready To Move", enabled: false },
//             { name: "Under Construction", enabled: false }
//         ]
//     },
//     saleType: {
//         title: "Sale Type",
//         type: "chips",
//         multiSelect: true,
//         options: [
//             { name: "New", enabled: false },
//             { name: "Resale", enabled: false }
//         ]
//     },
//     postedSince: {
//         title: "Posted Since",
//         type: "chips",
//         multiSelect: true,
//         options: [
//             { name: "Yesterday", enabled: false },
//             { name: "Last Week", enabled: false },
//             { name: "Last 2 Weeks", enabled: false },
//             { name: "Last Month", enabled: false },
//             { name: "Last 2 Months", enabled: false }
//         ]
//     },
//     amenities: {
//         title: "Amenities",
//         type: "chips",
//         multiSelect: true,
//         options: [
//             { name: "Park", enabled: false },
//             { name: "Parking", enabled: false },
//             { name: "Power Backup", enabled: false },
//             { name: "Lift", enabled: false },
//             { name: "Club house", enabled: false },
//             { name: "Gymnasium", enabled: false },
//             { name: "Swimming Pool", enabled: false },
//             { name: "Vaastu Compliant", enabled: false },
//             { name: "Gas Pipeline", enabled: false },
//             { name: "Security Personnel", enabled: false },
//             { name: "Pet Friendly", enabled: false },
//             { name: "Wheelchair Friendly", enabled: false },
//             { name: "AC Room", enabled: false },
//             { name: "Food Service", enabled: false },
//             { name: "Wifi", enabled: false },
//             { name: "Laundry Available", enabled: false }
//         ]
//     }
// };


export const filterKeywords = {
    'sell': { section: 'saleType', option: 'New' },
    'resale': { section: 'saleType', option: 'Resale' },
    'flat': { section: 'propertyType', option: 'Flat/Apartment' },
    'apartment': { section: 'propertyType', option: 'Flat/Apartment' },
    'villa': { section: 'propertyType', option: 'Independent House/Villa' },
    '1bhk': { section: 'bhkType', option: '1 BHK' },
    '2bhk': { section: 'bhkType', option: '2 BHK' },
    '3bhk': { section: 'bhkType', option: '3 BHK' },
    'pet': { section: 'amenities', option: 'Pet Friendly' },
    'pool': { section: 'amenities', option: 'Swimming Pool' }
};

export const actionKeywords = {
    'clear all': 'clearFilters',
    'reset filters': 'clearFilters'
};


// export const filterData = [
//     {
//         "type": "propertyType",
//         "title": "Type of Property",
//         "multiSelect": true,
//         "options": [
//             {"name": "Flat/Apartment", "enabled": false},
//             {"name": "Independent/Builder Floor", "enabled": false},
//             {"name": "Independent House/Villa", "enabled": false},
//             {"name": "1 RK/Studio Apartment", "enabled": false},
//             {"name": "Farm House", "enabled": false},
//             {"name": "Serviced Apartments", "enabled": false},
//             {"name": "Penthouse", "enabled": false},
//             {"name": "Residential House", "enabled": false},
//             {"name": "Gated Community Villa", "enabled": false},
//             {"name": "Other", "enabled": false}
//         ]
//     },
//     {
//         "type": "bhkType",
//         "title": "BHK Type",
//         "multiSelect": true,
//         "options": [
//             {"name": "1 RK", "enabled": false},
//             {"name": "1 BHK", "enabled": false},
//             {"name": "2 BHK", "enabled": false},
//             {"name": "3 BHK", "enabled": false},
//             {"name": "4 BHK", "enabled": false},
//             {"name": "5 BHK", "enabled": false},
//             {"name": "6 BHK", "enabled": false},
//             {"name": "7 BHK", "enabled": false},
//             {"name": "8 BHK", "enabled": false},
//             {"name": "9 BHK", "enabled": false},
//             {"name": "9+ BHK", "enabled": false}
//         ]
//     },
//     {
//         "type": "budget",
//         "title": "Budget / Rent Range",
//         "options": {
//             "min": 0,
//             "max": 1000000,
//             "step": 10000,
//             "currentMin": 0,
//             "currentMax": 1000000,
//             "labels": ["Min Budget", "Max Budget"]
//         }
//     },
//     {
//         "type": "visitAvailability",
//         "title": "Visit Availability",
//         "options": [
//             {"name": "Within next 2 days", "enabled": false}
//         ]
//     },
//     {
//         "type": "coveredArea",
//         "title": "Covered Area (sq.ft.)",
//         "options": {
//             "min": 0,
//             "max": 4000,
//             "step": 100,
//             "currentMin": 0,
//             "currentMax": 4000
//         }
//     },
//     {
//         "type": "possessionStatus",
//         "title": "Possession Status",
//         "multiSelect": true,
//         "options": [
//             {"name": "Ready To Move", "enabled": false},
//             {"name": "Under Construction", "enabled": false}
//         ]
//     },
//     {
//         "type": "saleType",
//         "title": "Sale Type",
//         "multiSelect": true,
//         "options": [
//             {"name": "New", "enabled": false},
//             {"name": "Resale", "enabled": false}
//         ]
//     },
//     {
//         "type": "postedSince",
//         "title": "Posted Since",
//         "multiSelect": true,
//         "options": [
//             {"name": "Yesterday", "enabled": false},
//             {"name": "Last Week", "enabled": false},
//             {"name": "Last 2 Weeks", "enabled": false},
//             {"name": "Last Month", "enabled": false},
//             {"name": "Last 2 Months", "enabled": false}
//         ]
//     },
//     {
//         "type": "amenities",
//         "title": "Amenities",
//         "multiSelect": true,
//         "options": [
//             {"name": "Park", "enabled": false},
//             {"name": "Parking", "enabled": false},
//             {"name": "Power Backup", "enabled": false},
//             {"name": "Lift", "enabled": false},
//             {"name": "Club house", "enabled": false},
//             {"name": "Gymnasium", "enabled": false},
//             {"name": "Swimming Pool", "enabled": false},
//             {"name": "Vaastu Compliant", "enabled": false},
//             {"name": "Gas Pipeline", "enabled": false},
//             {"name": "Security Personnel", "enabled": false},
//             {"name": "Pet Friendly", "enabled": false},
//             {"name": "Wheelchair Friendly", "enabled": false},
//             {"name": "AC Room", "enabled": false},
//             {"name": "Food Service", "enabled": false},
//             {"name": "Wifi", "enabled": false},
//             {"name": "Laundry Available", "enabled": false}
//         ]
//     }
// ]
