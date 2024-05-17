/// The actual "business" logic, a small wrapper around the `listeners` and `sysinfo` crates
use crate::error::Error;
use serde::Serialize;
use std::{
    io,
    sync::{Arc, Mutex},
};

#[derive(Debug, Default)]
pub(crate) struct Manager {
    system: Arc<Mutex<sysinfo::System>>,
}

impl Manager {
    pub(crate) fn new() -> Self {
        Self::default()
    }

    pub(crate) async fn get_port_listeners(
        &self,
    ) -> Result<impl Iterator<Item = PortListener>, Error> {
        let port_listeners = tauri::async_runtime::spawn_blocking::<_, Result<_, Error>>(|| {
            let port_listeners =
                listeners::get_all().map_err(|err| io::Error::other(err.to_string()))?;
            Ok(port_listeners.into_iter().map(Into::into))
        })
        .await??; // outer error = panics caught by the async runtime, inner error = error returned by the spawned closure

        Ok(port_listeners)
    }

    pub(crate) async fn kill_process(&self, process_id: u16) -> Result<(), Error> {
        let system = Arc::clone(&self.system);

        tauri::async_runtime::spawn_blocking(move || {
            let pid = sysinfo::Pid::from_u32(process_id.into());

            let killed = {
                let mut system = system.lock().unwrap();
                system.refresh_process(pid);
                system.process(pid).map(|p| p.kill()).unwrap_or(false)
            };

            if killed {
                Ok(())
            } else {
                Err(Error::new("Failed to kill process".into()))
            }
        })
        .await??;

        Ok(())
    }
}

#[derive(Clone, Debug, Eq, Hash, Ord, PartialEq, PartialOrd, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PortListener {
    // Order of fields determines the derived implementation of `Ord`/`PartialOrd`
    port: u16,
    process_name: String,
    process_id: u32,
}

impl From<listeners::Listener> for PortListener {
    fn from(value: listeners::Listener) -> PortListener {
        PortListener {
            port: value.socket.port(),
            process_id: value.process.pid,
            process_name: value.process.name,
        }
    }
}
