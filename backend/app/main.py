from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api.v1 import auth, customers, inventory, sales, finance, repairs, dashboard, purchases, expenses, reports, users, settings as settings_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Register routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth")
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users")
app.include_router(settings_router.router, prefix=f"{settings.API_V1_STR}/settings")
app.include_router(customers.router, prefix=f"{settings.API_V1_STR}/customers")
app.include_router(inventory.router, prefix=f"{settings.API_V1_STR}/inventory")
app.include_router(sales.router, prefix=f"{settings.API_V1_STR}/sales")
app.include_router(finance.router, prefix=f"{settings.API_V1_STR}/finance")
app.include_router(repairs.router, prefix=f"{settings.API_V1_STR}/repairs")
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard")
app.include_router(expenses.router, prefix=f"{settings.API_V1_STR}/expenses")
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports")
app.include_router(purchases.router, prefix=f"{settings.API_V1_STR}/inventory") # Group under inventory prefix for cleanliness or own prefix?
# Using inventory prefix for suppliers/purchases since it relates to stock
# Actually, let's use /purchases to match file structure, or mix?
# My API endpoints were defined as /suppliers and /purchases. If I prefix with /inventory, they become /inventory/suppliers. That sounds good.

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
