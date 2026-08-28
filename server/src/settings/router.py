import logging

from fastapi import APIRouter, HTTPException, Body
from sqlalchemy.orm.attributes import flag_modified

from sqlmodel import select

from src.settings.models import UserPreferredSettingsModel
from src.database import SessionDep
from src.auth.dependencies import CurrentUser
from src.settings.schemas import UserPreferredSettings, CarouselSettings

logging.basicConfig(level=logging.INFO)

router = APIRouter()


@router.get("/me/carousel_settings", response_model=UserPreferredSettings)
async def get_user_preferred_settings(db: SessionDep, user: CurrentUser) -> UserPreferredSettings:
    user_settings = await db.exec(
        select(UserPreferredSettingsModel).where(UserPreferredSettingsModel.user_id == user.id))
    user_settings = user_settings.first()

    if not user_settings:
        raise HTTPException(status_code=404, detail="Settings are not created but user are")

    return user_settings.settings


@router.put("/me/carousel_settings", response_model=UserPreferredSettings)
async def actualize_user_preferred_settings(db: SessionDep, user: CurrentUser, new_setting: CarouselSettings):
    user_settings = await db.exec(
        select(UserPreferredSettingsModel).where(UserPreferredSettingsModel.user_id == user.id))
    user_settings = user_settings.first()
    if not user_settings:
        raise HTTPException(status_code=404, detail="Settings are not created but user are")
    logging.error(user_settings)

    for index, setting in enumerate(user_settings.settings['selected_carousels']):
        logging.info(setting)
        if setting['id'] == new_setting.id:
            user_settings.settings['selected_carousels'][index] = new_setting.model_dump(mode='json')
            break

    user_settings.settings = user_settings.settings.copy()
    flag_modified(user_settings, "settings")

    db.add(user_settings)
    await db.commit()
    await db.refresh(user_settings)

    return user_settings.settings


@router.post("/me/carousel_settings", response_model=UserPreferredSettings)
async def actualize_user_preferred_settings(db: SessionDep, user: CurrentUser, new_setting: CarouselSettings):
    user_settings = await db.exec(
        select(UserPreferredSettingsModel).where(UserPreferredSettingsModel.user_id == user.id))
    user_settings = user_settings.first()
    if not user_settings:
        raise HTTPException(status_code=404, detail="Settings are not created but user are")
    logging.error(user_settings)

    user_settings.settings['selected_carousels'].append(new_setting.model_dump(mode='json'))

    user_settings.settings = user_settings.settings.copy()
    flag_modified(user_settings, "settings")

    db.add(user_settings)
    await db.commit()
    await db.refresh(user_settings)

    return user_settings.settings

@router.delete("/me/carousel_settings", response_model=UserPreferredSettings)
async def actualize_user_preferred_settings(db: SessionDep, user: CurrentUser, setting_id: str = Body(...)):
    user_settings = await db.exec(
        select(UserPreferredSettingsModel).where(UserPreferredSettingsModel.user_id == user.id))
    user_settings = user_settings.first()
    if not user_settings:
        raise HTTPException(status_code=404, detail="Settings are not created but user are")
    logging.error(user_settings)

    for index, setting in enumerate(user_settings.settings['selected_carousels']):
        logging.info(setting)
        if setting['id'] == setting_id:
            del user_settings.settings['selected_carousels'][index]
            break

    user_settings.settings = user_settings.settings.copy()
    flag_modified(user_settings, "settings")

    db.add(user_settings)
    await db.commit()
    await db.refresh(user_settings)

    return user_settings.settings