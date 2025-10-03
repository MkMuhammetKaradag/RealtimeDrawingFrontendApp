// src/components/JsonInput/JsonInput.types.ts

export interface JsonInputProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (jsonString: string) => void;
}
