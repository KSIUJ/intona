import uuid

from src.settings.schemas import CarouselSettings, FilterSettings, UserPreferredSettings


def generate_default_template(type_of_exercise: str):
    settings = CarouselSettings(
        id=str(uuid.uuid4()),
        type=type_of_exercise,
        exercise_name="",
        filter=FilterSettings(name="",
                              difficulties={
                                  "Easy": True,
                                  "Medium": True,
                                  "Hard": True},
                              rating=(0,
                                      100)))
    return settings

def generate_default_settings():
    return [generate_default_template("Song"), generate_default_template("Exercise")]

def generate_default_user_preferred_settings():
    return UserPreferredSettings(selected_carousels=generate_default_settings()).model_dump_json()