"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@schoolerp/ui";
import { User, ChevronRight } from "lucide-react";
import { apiClient } from '@/lib/api-client';

export default function ChildrenPage() {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChildren = async () => {
      setLoading(true);
      try {
        const res = await apiClient('/parent/me/children');
        if (!res.ok) {
          setChildren([]);
          return;
        }

        const payload = await res.json();
        if (Array.isArray(payload)) {
          setChildren(payload);
        } else {
          setChildren(payload?.data || []);
        }
      } catch (e) {
        console.error(e);
        setChildren([]);
      } finally {
        setLoading(false);
      }
    };

    loadChildren();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">My Children</h1>
        <p className="text-muted-foreground">
          View academic profiles and performance of your children.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading children...</div>
      ) : children.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-lg">
          <User className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No children linked</h3>
          <p className="text-sm text-muted-foreground">
            Please contact the school administration to link your children to your account.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child: any) => (
            <Card key={child.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold">{child.full_name}</CardTitle>
                <Badge variant={child.status === 'active' ? 'default' : 'secondary'}>
                  {child.status.toUpperCase()}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><span className="font-medium text-foreground">Admission No:</span> {child.admission_number}</p>
                  <p><span className="font-medium text-foreground">Class:</span> {child.class_name || 'N/A'} - {child.section_name || 'N/A'}</p>
                </div>
                <Button asChild className="w-full mt-4" variant="outline">
                  <Link href={`/parent/children/${child.id}`}>
                    View Profile <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
