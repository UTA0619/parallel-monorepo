//! OpenTelemetry tracing initialization.

pub fn init() {
    tracing_subscriber::fmt()
        .json()
        .with_target(false)
        .init();
}
