//! PARALLEL Orchestrator — manages the Sense → Reflect → Simulate → Advise pipeline.
//!
//! Each pipeline run is persisted to Postgres so it survives restarts.
//! Stages are idempotent: re-running a completed stage is a no-op.

mod pipeline;
mod stages;
mod telemetry;

use axum::{routing::get, routing::post, Router};
use tracing::info;

#[tokio::main]
async fn main() {
    telemetry::init();
    
    let app = Router::new()
        .route("/health", get(health))
        .route("/pipeline/run", post(pipeline::run_pipeline))
        .route("/pipeline/:run_id/status", get(pipeline::get_status));

    let addr = "0.0.0.0:8003";
    info!("PARALLEL Orchestrator listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health() -> &'static str {
    "ok"
}
