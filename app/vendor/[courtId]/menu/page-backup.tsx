"use client"

import { useState, useEffect } from "react"

export default function VendorMenuPage({ params }: { params: { courtId: string } }) {
  return (
    <div>
      <h1>Test Page - Court ID: {params.courtId}</h1>
    </div>
  )
}
