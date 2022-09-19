"""Schema definitions for ReSTful APIs based on `pydantic`"""

from pydantic import BaseModel
from typing import List, Sequence


class EmotionLink(BaseModel):
    source: str
    target: str
    value: float


class Node(BaseModel):
    id: str
    image: str
    group: str = "data"


class Metric(BaseModel):
    name: str = "ACC"
    value: float


class BackendResponse(BaseModel):
    nodes: List[Node]


class Annotation(BaseModel):
    image_id: str
    label: str
    current_nodes: List[str]
    new_nodes: int = 1


class ImageBoard(BaseModel):
    nodes: List[str]
