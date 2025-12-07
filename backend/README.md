# Backend (ASP.NET Core) - Restaurant Management

This folder contains a starter skeleton for the ASP.NET Core backend.

Quick start (Windows PowerShell):

```powershell
# from d:/fpt/backend
dotnet restore
# ensure you set a SQL Server connection string in appsettings.json
dotnet run
```

Notes:
- Add `appsettings.json` with `DefaultConnection` for SQL Server or change DbContext configuration.
- Implement Services/Repositories and Controllers per module (Users, Reservations, Orders, Inventory, etc.).
- Use DTOs to avoid leaking sensitive fields (PasswordHash etc.) to FE.
