"use client";

import { useEffect, useState } from "react";

const LOADING_MESSAGES = [
  "Checking ingredients...",
  "Reviewing certifications...",
  "Investigating supply chain...",
  "Generating report...",
];

const STATUS_MESSAGE_INTERVAL_MS = 2000;

export const getLoadingMessageAtIndex = (index: number): string => {
  const normalizedIndex = ((index % LOADING_MESSAGES.length) + LOADING_MESSAGES.length) % LOADING_MESSAGES.length;
  return LOADING_MESSAGES[normalizedIndex];
};

export const LoadingReport = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setMessageIndex((current) => current + 1);
    }, STATUS_MESSAGE_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <section className="loading-report" aria-live="polite">
      <div className="loading-report__header">
        <p className="loading-report__title">Analysing supply chain...</p>
        <p className="loading-report__status">{getLoadingMessageAtIndex(messageIndex)}</p>
      </div>

      <div className="loading-report__skeleton loading-report__skeleton--verdict" />
      <div className="loading-report__skeleton loading-report__skeleton--line" />
      <div className="loading-report__skeleton loading-report__skeleton--line" />

      <div className="loading-report__section">
        <div className="loading-report__skeleton loading-report__skeleton--section-title" />
        <div className="loading-report__skeleton loading-report__skeleton--line" />
        <div className="loading-report__skeleton loading-report__skeleton--line" />
      </div>

      <div className="loading-report__section">
        <div className="loading-report__skeleton loading-report__skeleton--section-title" />
        <div className="loading-report__skeleton loading-report__skeleton--line" />
        <div className="loading-report__skeleton loading-report__skeleton--line" />
      </div>
    </section>
  );
};
