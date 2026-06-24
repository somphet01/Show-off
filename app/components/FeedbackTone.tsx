"use client";

import { useEffect } from "react";
import { playFeedbackTone, type FeedbackToneType } from "../lib/feedback-tone";

export function FeedbackTone({ type }: { type: FeedbackToneType }) {
  useEffect(() => {
    playFeedbackTone(type);
  }, [type]);

  return null;
}
