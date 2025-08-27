// button-create.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  IconPlus,
} from "@tabler/icons-react"

export default function ButtonCreate({ action, route }: { action: string; route: string }) {
    return (
        <Link to={route}>
            <Button variant="outline" size="sm">
                <IconPlus />
                <span className="hidden lg:inline">{action}</span>
            </Button>
        </Link>
    );
};