from pydantic import BaseModel

class FilterSettings(BaseModel):
    name: str
    difficulties: dict
    rating: tuple[int, int]

class CarouselSettings(BaseModel):
    id: str
    # ideally we will use dynamically created list or enum to check if the type is valid
    type: str
    exercise_name: str
    filter: FilterSettings

class UserPreferredSettings(BaseModel):
    selected_carousels: list[CarouselSettings]