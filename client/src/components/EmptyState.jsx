export default function EmptyState({
  title = "Nothing to show",
  description = "There is no data for this view yet.",
  action = null,
}) {
  return (
    <div className="state-block">
      <div className="state-block__title">{title}</div>
      <p>{description}</p>
      {action}
    </div>
  );
}
