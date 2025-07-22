export interface Person {
    name: string
    height: string
    mass: string
    hair_color: string
    skin_color: string
    eye_color: string
    birth_year: string
    gender: string
    url: string
    homeworld?: string
    isFavorite?: boolean
    films?: string[];
    species?: string[];
    vehicles?: string[];
    starships?: string[];
    uid: string;
}

export interface Starship {
    name: string;
    cargo_capacity: string;
    passengers: string;
    max_atmosphering_speed: string;
    model: string;
    manufacturer: string;
    pilots?: string[];
    films?: string[];
    url: string;
    uid: string;
}

export interface Species {
    name: string;
    classification: string;
    designation: string;
    average_height: string;
    average_lifespan: string;
    hair_colors: string;
    eye_colors: string;
    people?: string[];
    skin_colors: string;
    language: string;
    homeworld: string;
    url: string;
    uid: string;
}