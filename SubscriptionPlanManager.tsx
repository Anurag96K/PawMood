
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Check, X, Pencil } from "lucide-react";

interface SubscriptionPlan {
    id: string;
    name: string;
    price_display: string;
    description: string | null;
    features: string[] | null;
    is_active: boolean;
    tier_id: string;
}

export function SubscriptionPlanManager() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<SubscriptionPlan>>({});

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("subscription_plans")
                .select("*")
                .order("price_display", { ascending: true }); // Simple string sort for now

            if (error) throw error;
            setPlans(data || []);
        } catch (error: any) {
            toast.error("Failed to load plans");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (plan: SubscriptionPlan) => {
        setEditingId(plan.id);
        setEditForm(plan);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = async () => {
        if (!editingId) return;

        try {
            const { error } = await supabase
                .from("subscription_plans")
                .update({
                    name: editForm.name,
                    price_display: editForm.price_display,
                    description: editForm.description,
                    is_active: editForm.is_active
                })
                .eq("id", editingId);

            if (error) throw error;

            toast.success("Plan updated successfully");
            fetchPlans(); // Refresh
            cancelEdit();
        } catch (error: any) {
            toast.error("Failed to update plan");
        }
    };

    if (loading) return <div>Loading plans...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Subscription Settings</h2>
                <Button onClick={() => fetchPlans()} variant="outline" size="sm">Refresh</Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                    <Card key={plan.id} className={!plan.is_active ? "opacity-75 bg-muted" : ""}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    {editingId === plan.id ? (
                                        <Input
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            className="mb-2 font-bold"
                                        />
                                    ) : (
                                        <CardTitle>{plan.name}</CardTitle>
                                    )}
                                    <Badge variant={plan.is_active ? "outline" : "secondary"}>
                                        {plan.tier_id}
                                    </Badge>
                                </div>
                                {editingId !== plan.id && (
                                    <Button size="icon" variant="ghost" onClick={() => startEdit(plan)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Display Price</Label>
                                {editingId === plan.id ? (
                                    <Input
                                        value={editForm.price_display}
                                        onChange={(e) => setEditForm({ ...editForm, price_display: e.target.value })}
                                    />
                                ) : (
                                    <div className="text-2xl font-bold">{plan.price_display}</div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Description</Label>
                                {editingId === plan.id ? (
                                    <Textarea
                                        value={editForm.description || ""}
                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                                )}
                            </div>

                            {editingId === plan.id && (
                                <div className="flex items-center space-x-2 pt-2">
                                    <Switch
                                        checked={editForm.is_active}
                                        onCheckedChange={(c) => setEditForm({ ...editForm, is_active: c })}
                                    />
                                    <Label>Plan Active?</Label>
                                </div>
                            )}
                        </CardContent>
                        {editingId === plan.id && (
                            <CardFooter className="flex justify-between border-t pt-4">
                                <Button variant="ghost" onClick={cancelEdit}>Cancel</Button>
                                <Button onClick={saveEdit}>Save</Button>
                            </CardFooter>
                        )}
                    </Card>
                ))}
            </div>

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm">
                <strong>Note:</strong> Changing the price here only updates the <em>display text</em> in the app.
                You must also update the actual price in your App Store / Play Store / Stripe dashboard to match!
            </div>
        </div>
    );
}
