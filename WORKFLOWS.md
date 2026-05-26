# RedDoorz Cebu: Academic Program Flowcharts

This document provides separate, pure flowcharts for each role in the system. These follow the strict **Academic Tradition** using standard symbols:
- **Stadium `([ ])`**: Start and End points.
- **Rectangle `[ ]`**: Internal Processes (Code execution).
- **Diamond `{ }`**: Decisions (Conditional logic).
- **Parallelogram `[/ /]`**: Input/Output (User interaction & Screen display).

---

## 1. System Initialization & Auth Gate
How the program starts and identifies the user role.

```mermaid
flowchart TD
    Start([Start]) --> Init[Process: components.js loads Navbar]
    Init --> AuthCheck{Decision: Is User Logged In?}
    
    AuthCheck -- No --> GuestIO[/Output: Show index.html with Login Button/]
    GuestIO --> EndGuest([End Session])
    
    AuthCheck -- Yes --> GetProfile[Process: Fetch /users/UID from Firestore]
    GetProfile --> RoleGate{Decision: What is user.role?}
    
    RoleGate -- "user" --> A((A))
    RoleGate -- "partner" --> B((B))
    RoleGate -- "admin" --> C((C))
```

---

## 2. Role: Customer (User) Workflow

### 2.1 Sub-Flow: Search & Property Selection
Logic for finding and selecting a hotel in Cebu.

```mermaid
flowchart TD
    StartUser((A)) --> ShowIndex[/Output: Show Personalized index.html/]
    
    ShowIndex --> SearchIO[/Input: Enter Location in Search Bar/]
    SearchIO --> ListingsIO[/Output: Show filtered listings.js/]
    
    ListingsIO --> SelectHotel[/Input: Click Property Card/]
    SelectHotel --> DetailsIO[/Output: Show details.html/]
    
    DetailsIO --> SelectDates[/Input: Choose Check-in/Out Dates/]
    SelectDates --> DateLogic[Process: Auto-snap Check-out to +1 Day]
    
    DateLogic --> A1((A1))
```

### 2.2 Sub-Flow: Checkout & Post-Stay Review
Logic for finalizing the booking and sharing feedback.

```mermaid
flowchart TD
    StartA1((A1)) --> BookBtn[/Input: Click Book Now/]
    BookBtn --> SummaryIO[/Output: Show booking_summary.html/]
    
    SummaryIO --> ConfirmIO[/Input: Click Confirm and Book/]
    ConfirmIO --> SaveDB[Process: addDoc to /bookings/ collection]
    
    SaveDB --> SuccessIO[/Output: Display Success Alert/]
    SuccessIO --> MyBookings[/Output: Show my_bookings.html/]
    
    MyBookings --> ReviewCheck{Decision: Is stay Completed?}
    ReviewCheck -- Yes --> AddReview[Process: updateDoc property rating]
    ReviewCheck -- No --> EndUser([End User Flow])
    AddReview --> EndUser
```

---

## 3. Role: Property Owner (Partner) Workflow

### 3.1 Partner Main Hub
The entry point and primary decision tree for property owners.

```mermaid
flowchart TD
    StartPartner((B)) --> RedirectPartner[Process: Redirect to partner_dashboard.html]
    RedirectPartner --> FetchOwn[Process: query properties WHERE partnerId == UID]
    FetchOwn --> StatsIO[/Output: Display Sales & Property Stats/]
    
    StatsIO --> Action{Decision: Partner Action?}
    
    Action -- "Add/Edit Listing" --> B1((B1))
    Action -- "Manage Guests" --> B2((B2))
    Action -- "Toggle Status" --> ToggleStatus[Process: updateDoc isActive = !status]
    ToggleStatus --> StatsIO
    
    Action -- "Logout" --> EndPartner([End Partner Flow])
```

### 3.2 Sub-Flow: Property Listing (B1)
Handles listing creation and image processing.

```mermaid
flowchart TD
    SubB1((B1)) --> InputProp[/Input: Enter Name, Price, Images/]
    InputProp --> AmenitiesIO[/Input: Select Preset Amenities Checkboxes/]
    AmenitiesIO --> UploadImg[Process: Upload to Cloudinary API]
    UploadImg --> SaveProp[Process: addDoc to /properties/]
    SaveProp --> ReturnHub((B))
```

### 3.3 Sub-Flow: Booking Management (B2)
Handles guest arrivals and status updates.

```mermaid
flowchart TD
    SubB2((B2)) --> BookingList[/Output: View bookings for own hotels/]
    BookingList --> CheckAction{Decision: Arrival Status?}
    
    CheckAction -- "Check-in" --> UpdateCI[Process: updateDoc status: checked-in]
    CheckAction -- "Complete" --> UpdateComp[Process: updateDoc status: completed]
    CheckAction -- "No Show" --> UpdateNS[Process: updateDoc status: no-show]
    
    UpdateCI --> ReturnHub((B))
    UpdateComp --> ReturnHub((B))
    UpdateNS --> ReturnHub((B))
```

---

## 4. Role: Platform Manager (Admin) Workflow

### 4.1 Admin Main Hub
Global oversight of system performance and platform health.

```mermaid
flowchart TD
    StartAdmin((C)) --> RedirectAdmin[Process: Redirect to admin_dashboard.html]
    RedirectAdmin --> FetchAll[Process: getDocs ALL Users, Bookings, Props]
    FetchAll --> CalcStats[Process: SUM total revenue & user counts]
    
    CalcStats --> AdminStatsIO[/Output: Display Global Revenue & Users/]
    
    AdminStatsIO --> AdminAction{Decision: Admin Action?}
    
    AdminAction -- "Manage Users" --> C1((C1))
    AdminAction -- "Moderate Content" --> C2((C2))
    AdminAction -- "Logout" --> EndAdmin([End Admin Flow])
```

### 4.2 Sub-Flow: User Moderation (C1)
Logic for managing user accounts and access roles.

```mermaid
flowchart TD
    SubC1((C1)) --> UserTable[/Output: Show ALL registered accounts/]
    UserTable --> ModChoice{Decision: Select Action?}
    
    ModChoice -- "Switch Role" --> UpdateRole[Process: updateDoc user.role: partner/user]
    ModChoice -- "Delete" --> DeleteUser[Process: deleteDoc from /users/]
    
    UpdateRole --> ReturnHub((C))
    DeleteUser --> ReturnHub((C))
```

### 4.3 Sub-Flow: Platform Control (C2)
Logic for moderating listings and system-wide transactions.

```mermaid
flowchart TD
    SubC2((C2)) --> MasterTables[/Output: Show ALL Properties & Bookings/]
    MasterTables --> ControlChoice{Decision: Select Moderation?}
    
    ControlChoice -- "Pause Listing" --> ToggleProp[Process: updateDoc property.isActive]
    ControlChoice -- "Force Cancel" --> CancelBooking[Process: updateDoc booking.status: cancelled]
    ControlChoice -- "Delete Item" --> DeleteProp[Process: deleteDoc from /properties/]
    
    ToggleProp --> ReturnHub((C))
    CancelBooking --> ReturnHub((C))
    DeleteProp --> ReturnHub((C))
```
