CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE problem_types (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    input_schema JSONB NOT NULL,
    scoring_function VARCHAR(50) NOT NULL
);

CREATE TABLE algorithms (
    id BIGSERIAL PRIMARY KEY,
    problem_type_id BIGINT NOT NULL REFERENCES problem_types(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    paradigm VARCHAR(50) NOT NULL,
    worker_entrypoint VARCHAR(255) NOT NULL,
    UNIQUE(problem_type_id, code)
);

CREATE TABLE datasets (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT REFERENCES users(id),
    problem_type_id BIGINT NOT NULL REFERENCES problem_types(id),
    name VARCHAR(255) NOT NULL,
    raw_input JSONB NOT NULL,
    size_metric INT,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE races (
    id BIGSERIAL PRIMARY KEY,
    dataset_id BIGINT NOT NULL REFERENCES datasets(id),
    initiated_by BIGINT REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE TABLE runs (
    id BIGSERIAL PRIMARY KEY,
    race_id BIGINT NOT NULL REFERENCES races(id),
    algorithm_id BIGINT NOT NULL REFERENCES algorithms(id),
    status VARCHAR(20) NOT NULL DEFAULT 'queued',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    final_score DOUBLE PRECISION,
    runtime_ms BIGINT,
    peak_memory_kb BIGINT,
    iterations INT,
    result_output JSONB
);

CREATE TABLE run_events (
    id BIGSERIAL PRIMARY KEY,
    run_id BIGINT NOT NULL REFERENCES runs(id),
    event_time TIMESTAMP NOT NULL DEFAULT now(),
    iteration INT,
    current_score DOUBLE PRECISION,
    elapsed_ms BIGINT,
    payload JSONB
);

CREATE TABLE leaderboard_entries (
    id BIGSERIAL PRIMARY KEY,
    problem_type_id BIGINT NOT NULL REFERENCES problem_types(id),
    algorithm_id BIGINT NOT NULL REFERENCES algorithms(id),
    dataset_size_bucket VARCHAR(20),
    wins INT NOT NULL DEFAULT 0,
    total_races INT NOT NULL DEFAULT 0,
    avg_score DOUBLE PRECISION,
    avg_runtime_ms DOUBLE PRECISION,
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE(problem_type_id, algorithm_id, dataset_size_bucket)
);

CREATE INDEX idx_runs_race ON runs(race_id);
CREATE INDEX idx_run_events_run ON run_events(run_id);
CREATE INDEX idx_datasets_problem_type ON datasets(problem_type_id);
CREATE INDEX idx_races_dataset ON races(dataset_id);