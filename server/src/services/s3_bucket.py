import boto3
import botocore
from botocore.config import Config
from mypy_boto3_s3 import S3Client

from src.config import settings

default_region = boto3.session.Session().region_name

bucket_client: S3Client = boto3.client(
    service_name="s3",
    endpoint_url=settings.bucket_endpoint,
    region_name=default_region,
    aws_access_key_id=settings.bucket_access_key.get_secret_value(),
    aws_secret_access_key=settings.bucket_secret_key.get_secret_value(),
    config=Config(signature_version='s3v4')
)


