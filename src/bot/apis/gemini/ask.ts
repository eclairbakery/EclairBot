import * as gemini from './model.ts';

export const toolDeclarations: gemini.Tool[] = [
    {
        functionDeclarations: [
            {
                name: 'list_categories',
                description: 'Zwraca listę wszystkich kategorii komend bota.',
                parameters: {
                    type: gemini.SchemaType.OBJECT,
                    properties: {},
                },
            },
            {
                name: 'list_commands',
                description: 'Zwraca listę wszystkich dostępnych komend bota w danej kategorii wraz z ich krótkimi opisami.',
                parameters: {
                    type: gemini.SchemaType.OBJECT,
                    properties: {
                        category: {
                            type: gemini.SchemaType.STRING,
                            description: "Kategoria do filtrowania komend (np. 'economy', 'mod', 'general').",
                        },
                    },
                    required: ['category'],
                },
            },
            {
                name: 'get_command_help',
                description: 'Zwraca szczegółowe informacje o konkretnej komendzie, w tym jej opis, aliasy i argumenty.',
                parameters: {
                    type: gemini.SchemaType.OBJECT,
                    properties: {
                        command_name: {
                            type: gemini.SchemaType.STRING,
                            description: 'Nazwa komendy do sprawdzenia.',
                        },
                    },
                    required: ['command_name'],
                },
            },
            {
                name: 'search_command',
                description: 'Szuka komendy na podstawie słowa kluczowego lub fragmentu opisu.',
                parameters: {
                    type: gemini.SchemaType.OBJECT,
                    properties: {
                        query: {
                            type: gemini.SchemaType.STRING,
                            description: 'Słowo kluczowe do wyszukania w nazwach i opisach komend.',
                        },
                    },
                    required: ['query'],
                },
            },
            {
                name: 'get_server_stats',
                description: 'Zwraca statystyki serwera, takie jak całkowita liczba użytkowników i liczba aktywnych osób.',
                parameters: {
                    type: gemini.SchemaType.OBJECT,
                    properties: {},
                },
            },
            {
                name: 'fetch_reddit_post',
                description: 'Pobiera treść posta z Reddita na podstawie podanego linku.',
                parameters: {
                    type: gemini.SchemaType.OBJECT,
                    properties: {
                        url: {
                            type: gemini.SchemaType.STRING,
                            description: 'Link do posta na Reddicie.',
                        },
                    },
                    required: ['url'],
                },
            },
            {
                name: 'github_get_repo_tree',
                description: 'Pobiera listę plików w repozytorium GitHub.',
                parameters: {
                    type: gemini.SchemaType.OBJECT,
                    properties: {
                        owner: { type: gemini.SchemaType.STRING, description: 'Właściciel repozytorium.' },
                        repo: { type: gemini.SchemaType.STRING, description: 'Nazwa repozytorium.' },
                        branch: { type: gemini.SchemaType.STRING, description: 'Branch (opcjonalnie, domyślnie main).' },
                    },
                    required: ['owner', 'repo'],
                },
            },
            {
                name: 'github_get_file_content',
                description: 'Pobiera zawartość konkretnego pliku z repozytorium GitHub.',
                parameters: {
                    type: gemini.SchemaType.OBJECT,
                    properties: {
                        owner: { type: gemini.SchemaType.STRING, description: 'Właściciel repozytorium.' },
                        repo: { type: gemini.SchemaType.STRING, description: 'Nazwa repozytorium.' },
                        path: { type: gemini.SchemaType.STRING, description: 'Ścieżka do pliku.' },
                        branch: { type: gemini.SchemaType.STRING, description: 'Branch (opcjonalnie, domyślnie main).' },
                    },
                    required: ['owner', 'repo', 'path'],
                },
            },
            {
                name: 'github_search_code',
                description: 'Przeszukuje kod wewnątrz repozytorium GitHub.',
                parameters: {
                    type: gemini.SchemaType.OBJECT,
                    properties: {
                        owner: { type: gemini.SchemaType.STRING, description: 'Właściciel repozytorium.' },
                        repo: { type: gemini.SchemaType.STRING, description: 'Nazwa repozytorium.' },
                        query: { type: gemini.SchemaType.STRING, description: 'Zapytanie wyszukiwania.' },
                    },
                    required: ['owner', 'repo', 'query'],
                },
            },
            {
                name: 'github_get_readme',
                description: 'Pobiera zawartość pliku README z repozytorium GitHub.',
                parameters: {
                    type: gemini.SchemaType.OBJECT,
                    properties: {
                        owner: { type: gemini.SchemaType.STRING, description: 'Właściciel repozytorium.' },
                        repo: { type: gemini.SchemaType.STRING, description: 'Nazwa repozytorium.' },
                        branch: { type: gemini.SchemaType.STRING, description: 'Branch (opcjonalnie, domyślnie main).' },
                    },
                    required: ['owner', 'repo'],
                },
            },
        ],
    },
];
