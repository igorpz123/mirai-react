// button-create.tsx
"use client";

// React import not needed with new JSX transform
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