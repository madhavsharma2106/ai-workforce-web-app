"use client";

import { useState } from "react";
import { Button, Heading, Modal, Text, Textarea } from "@/components/atoms";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (customMessage: string | null) => void;
};

export const SearchAgainModal = ({ open, onClose, onSubmit }: Props) => {
  const [instructions, setInstructions] = useState("");

  const handleClose = () => {
    setInstructions("");
    onClose();
  };

  const handleUsualCriteria = () => {
    setInstructions("");
    onSubmit(null);
  };

  const handleSearch = () => {
    const trimmed = instructions.trim();
    if (!trimmed) return;
    setInstructions("");
    onSubmit(trimmed);
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Heading as="h2" size="sm">
        Search again
      </Heading>
      <Text size="sm" tone="muted" className="mt-2">
        Want me to focus on something specific this time, or should I use your
        usual profile?
      </Text>
      <Textarea
        rows={3}
        className="mt-4"
        placeholder="e.g. tech startups in Germany that fit us well"
        value={instructions}
        onChange={(event) => setInstructions(event.target.value)}
      />
      <div className="mt-4 flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={handleUsualCriteria}>
          Use usual criteria
        </Button>
        <Button
          variant="primary"
          onClick={handleSearch}
          disabled={!instructions.trim()}
        >
          Search
        </Button>
      </div>
    </Modal>
  );
};
