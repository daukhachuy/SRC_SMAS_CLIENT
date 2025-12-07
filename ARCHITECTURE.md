# Architecture & ERD Guidance — Restaurant Management System

This document is a developer-facing guide summarizing entities, folder responsibilities and implementation tips for the restaurant management system.

## High-level modules (map to controllers/services/repositories and FE pages)
- Auth/User Management: Users, Employees, Roles, Permissions
- Restaurant: Branches, Tables, Opening hours
- Reservations: Bookings with date, time, guest count, status
- Orders: Orders placed by customers at tables or for delivery
- Menu: MenuItem, Categories
- Inventory: InventoryItem, stock levels, restock events
- Recipe: mapping MenuItem -> required InventoryItem quantities
- Supplier: supplier entities and purchase orders
- Delivery: delivery orders, tracking, status
- Payment/Invoice: Payments, Invoice entities
- Blog: BlogPost, Comments
- Chatbot: ChatMessage, Conversation
- AdminLog: operations audit
- Shifts: employee shifts, clock-in/out
- Feedback: customer reviews and ratings

## Suggested key entities (start from these)
- User (Id, UserName, Email, PasswordHash, Role(s), Phone)
- Employee (Id, FullName, Role, Email, Phone, IsActive)
- Restaurant (Id, Name, Address, OpenHours)
- Table (Id, RestaurantId, Name/Number, Seats)
- Reservation (Id, UserId, TableId?, DateTime, Guests, Status)
- MenuItem (Id, Name, Price, Category, IsAvailable)
- Recipe (Id, MenuItemId, List of RecipeIngredient { InventoryItemId, Quantity })
- InventoryItem (Id, Name, Unit, QuantityOnHand, ReorderLevel)
- Supplier (Id, Name, ContactInfo)
- PurchaseOrder (Id, SupplierId, Items, Status)
- Order (Id, UserId, TableId?, Items, Total, Status, DeliveryId?)
- Delivery (Id, OrderId, Address, Status, TrackingInfo)
- Payment (Id, OrderId, Amount, Method, Status)
- Invoice (Id, OrderId, IssuedAt, Lines)
- BlogPost (Id, Title, Slug, Content, AuthorId, Published)
- ChatMessage (Id, ConversationId, SenderId, Text, Timestamp)
- AdminLog (Id, AdminId, Action, Entity, EntityId, Timestamp)
- Shift (Id, EmployeeId, Start, End, Role)
- Feedback (Id, UserId, OrderId?, Rating, Comment)

## Backend implementation notes
- Controllers: lightweight, only input validation + call Services.
- Services: business rules — e.g., placing an order should deduct inventory, calculate taxes, create invoice, optionally create delivery.
- Repositories: one per aggregate for EF Core queries and transactional boundaries.
- Transactions: wrap operations that change multiple aggregates (Order -> Inventory -> Invoice) in a DB transaction.
- DTOs: send only necessary fields to FE. Never send `PasswordHash` or internal audit fields.
- Middleware: JWT auth, exception handling, request logging.
- Seeding: add seed data for admin user, sample menu items, restaurant branches.

## Frontend implementation notes
- Route structure mirrors backend concepts: `/reservations`, `/orders`, `/inventory`, `/suppliers`, `/delivery`, `/invoices`, `/blog`, `/chat`.
- Use Context or Redux for Auth, Notifications and Cart/Order draft state.
- Components: small, focused, documented props.
- API layer: one file per resource with typed functions (e.g., `reservationApi.js`, `orderApi.js`).
- Forms: use form library (React Hook Form) for validation.

## Next recommended tasks
1. Create ERD diagram from above entities and relations (one-to-many, many-to-many via join tables).
2. Implement DB migrations and seed data in `backend/Data/SeedData.cs`.
3. Build auth (JWT), user registration and login flow; add role-based authorization.
4. Implement reservation confirmation flow with email/sms notifications.
5. Create wireframes for key screens (Admin dashboard, Reservation flow, Order POS screen, Inventory management).

Keep each change small and covered by one or two commits, and add integration tests for critical flows (placing order, deducting inventory, creating invoice).
