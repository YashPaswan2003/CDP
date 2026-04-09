from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    name: str
    role: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: User

class LogoutRequest(BaseModel):
    pass
