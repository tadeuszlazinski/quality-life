export function ToolLoading() {
  return (
    <div className="tool-loading">
      <img className="loading-mark" src="/icon.svg" alt="" aria-hidden="true" />
      <div>
        <strong>Opening tool</strong>
        <span>Preparing the quiet workspace and loading what it needs.</span>
      </div>
    </div>
  );
}
