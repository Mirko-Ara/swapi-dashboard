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
}

export interface Starship {
    name: string,
    cargo_capacity: string,
    passengers: string,
    max_atmosphering_speed: string,
    model: string,
    manufacturer: string,
    pilots?: string[],
    films?: string[],
    url: string
}