import { link } from "@/app/shared/links"
import { Link as RouterLink } from "react-router-dom"; // Using react-router-dom Link
import { Button } from "@/app/shared/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/shared/components/ui/card"

export function Landing() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Fullstack CF Example</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <a href={link("/home")}>Go to Home Page (User Dashboard)</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <RouterLink to="/blog">View Blog</RouterLink>
            </Button>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> The home page is protected and requires
              authentication. You will be redirected to login if you're not
              signed in.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
