; Custom NSIS include for electron-builder (referenced from build.nsis.include).
;
; Force-close any running instance of the app BEFORE the installer copies files,
; so it never fails with "the application is still running / files are in use".
; `customInit` runs at installer startup — for both first installs and updates.
;
; NOTE: the /IM name must match build.productName + ".exe". Update it here if the
; product name changes ("PI Clickers Overlay").

!macro customInit
  ; /F = force, /T = also kill child (renderer / GPU) processes.
  ; nsExec::Exec runs the command hidden (no console window flash).
  nsExec::Exec 'taskkill /F /T /IM "PI Clickers Overlay.exe"'
!macroend
