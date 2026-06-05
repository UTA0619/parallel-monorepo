//! Individual pipeline stage implementations.

pub mod sense {
    use crate::pipeline::PipelineTrigger;
    use anyhow::Result;
    use serde::{Deserialize, Serialize};

    #[derive(Debug, Serialize, Deserialize)]
    pub struct SenseOutput {
        pub content: String,
        pub segments: Vec<String>,
        pub source: String,
    }

    pub async fn run(user_id: &str, trigger: &PipelineTrigger) -> Result<SenseOutput> {
        let (content, source) = match trigger {
            PipelineTrigger::MorningReport { date } => {
                (format!("Morning report for {}", date), "morning_report".to_string())
            }
            PipelineTrigger::TapToConverse { audio_url } => {
                // In production: call Whisper API to transcribe
                (format!("Transcription of {}", audio_url), "tap_to_converse".to_string())
            }
            PipelineTrigger::Reflection { responses } => {
                (responses.join(" | "), "reflection".to_string())
            }
        };

        Ok(SenseOutput {
            segments: vec![content.clone()],
            content,
            source,
        })
    }
}

pub mod reflect {
    use super::sense::SenseOutput;
    use anyhow::Result;
    use serde::{Deserialize, Serialize};

    #[derive(Debug, Serialize, Deserialize)]
    pub struct ReflectOutput {
        pub retrieved_memories: Vec<serde_json::Value>,
        pub context_summary: String,
    }

    pub async fn run(user_id: &str, sense: &SenseOutput) -> Result<ReflectOutput> {
        // In production: call memory-py /memories/retrieve
        Ok(ReflectOutput {
            retrieved_memories: vec![],
            context_summary: format!("Context for {}: {}", user_id, &sense.content[..sense.content.len().min(100)]),
        })
    }
}

pub mod advise {
    use super::reflect::ReflectOutput;
    use anyhow::Result;

    pub async fn run(user_id: &str, reflect: &ReflectOutput) -> Result<String> {
        // In production: call ai-core morning report generator via HTTP
        Ok(format!("Morning report for {} — context: {}", user_id, &reflect.context_summary[..reflect.context_summary.len().min(50)]))
    }
}
