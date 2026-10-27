from pydantic import BaseModel


class DistrictRentItem(BaseModel):
    region_code: str
    region_name: str
    median_rent: float | None = None
