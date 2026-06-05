//! Pipeline execution: Sense → Reflect → Simulate → Advise

use axum::{extract::Path, Json};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use tracing::{info, error, instrument};

use crate::stages::{sense, reflect, advise};

#[derive(Debug, Serialize, Deserialize)]
pub struct PipelineRequest {
    pub user_id: String,
    pub trigger: PipelineTrigger,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PipelineTrigger {
    MorningReport { date: String },
    TapToConverse { audio_url: String },
    Reflection { responses: Vec<String> },
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PipelineRun {
    pub run_id: String,
    pub user_id: String,
    pub status: PipelineStatus,
    pub current_stage: Option<Stage>,
    pub started_at: String,
    pub completed_at: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PipelineStatus {
    Running,
    Completed,
    Failed,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Stage {
    Sense,
    Reflect,
    Simulate,
    Advise,
}

#[instrument(skip_all, fields(user_id = %req.user_id))]
pub async fn run_pipeline(Json(req): Json<PipelineRequest>) -> Json<PipelineRun> {
    let run_id = Uuid::now_v7().to_string();
    info!(run_id = %run_id, trigger = ?req.trigger, "Pipeline started");

    // Stage 1: Sense
    let sense_output = match sense::run(&req.user_id, &req.trigger).await {
        Ok(out) => out,
        Err(e) => {
            error!("Sense stage failed: {}", e);
            return Json(PipelineRun {
                run_id,
                user_id: req.user_id,
                status: PipelineStatus::Failed,
                current_stage: Some(Stage::Sense),
                started_at: chrono_now(),
                completed_at: None,
                error: Some(e.to_string()),
            });
        }
    };

    // Stage 2: Reflect
    let reflect_output = match reflect::run(&req.user_id, &sense_output).await {
        Ok(out) => out,
        Err(e) => {
            error!("Reflect stage failed: {}", e);
            return Json(PipelineRun {
                run_id,
                user_id: req.user_id,
                status: PipelineStatus::Failed,
                current_stage: Some(Stage::Reflect),
                started_at: chrono_now(),
                completed_at: None,
                error: Some(e.to_string()),
            });
        }
    };

    // Stage 3: Simulate (skip if insufficient memories)
    // Note: full simulation is nightly batch; here we use cached simulation results

    // Stage 4: Advise
    let _report = match advise::run(&req.user_id, &reflect_output).await {
        Ok(r) => r,
        Err(e) => {
            error!("Advise stage failed: {}", e);
            return Json(PipelineRun {
                run_id,
                user_id: req.user_id,
                status: PipelineStatus::Failed,
                current_stage: Some(Stage::Advise),
                started_at: chrono_now(),
                completed_at: None,
                error: Some(e.to_string()),
            });
        }
    };

    info!(run_id = %run_id, "Pipeline completed");
    Json(PipelineRun {
        run_id,
        user_id: req.user_id,
        status: PipelineStatus::Completed,
        current_stage: None,
        started_at: chrono_now(),
        completed_at: Some(chrono_now()),
        error: None,
    })
}

pub async fn get_status(Path(run_id): Path<String>) -> Json<serde_json::Value> {
    // In production: query orchestration_runs table from Postgres
    Json(serde_json::json!({ "run_id": run_id, "status": "not_implemented" }))
}

fn chrono_now() -> String {
    // In production: use chrono::Utc::now().to_rfc3339()
    "2026-06-05T00:00:00Z".to_string()
}
