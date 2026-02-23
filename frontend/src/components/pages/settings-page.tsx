import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your organization and account preferences.
        </p>
      </div>

      {/* Org Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Information</CardTitle>
          <CardDescription>
            Update your organization details. These are visible to all team
            members.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              id="org-name"
              placeholder="[Org Name]"
              defaultValue="[Org Name]"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cage-code">CAGE Code</Label>
            <Input id="cage-code" placeholder="e.g. 1ABC2" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="uei">Unique Entity ID (UEI)</Label>
            <Input id="uei" placeholder="e.g. ZQGGHJH74DW7" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="primary-naics">Primary NAICS Code</Label>
            <Input id="primary-naics" placeholder="e.g. 541512" />
          </div>
        </CardContent>
        <CardFooter className="justify-end border-t pt-4">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Save Changes
          </Button>
        </CardFooter>
      </Card>

      <Separator />

      {/* Account settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Manage your personal account settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-2">
            <Label htmlFor="full-name">Full Name</Label>
            <Input
              id="full-name"
              placeholder="Jane Smith"
              defaultValue="Jane Smith"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="jane.smith@example.gov"
              defaultValue="jane.smith@example.gov"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">Role</Label>
            <Input id="role" placeholder="Contracts Manager" defaultValue="Contracts Manager" disabled />
            <p className="text-xs text-muted-foreground">
              Roles are managed by your organization administrator.
            </p>
          </div>
        </CardContent>
        <CardFooter className="justify-end border-t pt-4">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Update Account
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
