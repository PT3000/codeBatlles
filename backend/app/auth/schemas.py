import Optional
from fastapi_users import schemas
from pydantic import BaseModel, EmailStr, field_validator
import re

class UserCreate(schemas.BaseUserCreate):
    email: EmailStr
    password: str
    username: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if not re.match(r"^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$", v):
            raise ValueError("비밀번호는 영문+숫자 조합 8자 이상이어야 합니다.")
        return v

    @field_validator("username")
    @classmethod
    def validate_username(cls, v):
        if not re.match(r"^[a-zA-Z0-9_]{3,20}$", v):
            raise ValueError("아이디는 영문/숫자/밑줄 3~20자여야 합니다.")
        return v

class UserRead(schemas.BaseUser[int]):
    id: int
    email: EmailStr
    username: str
    tier: str
    is_admin: bool
    is_online: bool

    class Config:
        from_attributes = True

class UserUpdate(schemas.BaseUserUpdate):
    username: Optional[str] = None
    tier: Optional[str] = None