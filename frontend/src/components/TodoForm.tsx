import { useState } from "react";

import type { SubmitEvent } from "react";

type Props = {
  onSubmit: (title: string) => void;
  initialTitle?: string;
  submitLabel?: string;
};

function TodoForm({
  onSubmit,
  initialTitle = "",
  submitLabel = "追加",
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [error, setError] = useState("");

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      setError("ToDoを入力してください。");
      return;
    }

    // ToDoのタイトルが50文字以内かどうか;
    if (title.trim().length > 50) {
      setError("ToDoは50文字以内で入力してください。");
      return;
    }

    onSubmit(title);
    setTitle("");
    setError("");
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <input
        type="text"
        name="title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="ToDoを入力"
        maxLength={50}
      />
      <button type="submit">{submitLabel}</button>
    </form>
  );
}

export default TodoForm;
