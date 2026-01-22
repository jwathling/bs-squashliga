import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout/Layout";
import { CreateTournamentForm } from "@/components/tournaments/CreateTournamentForm";
import { ArrowLeft, Trophy } from "lucide-react";

const NewTournament = () => {
  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/tournaments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Neues Turnier</h1>
          <p className="text-muted-foreground">Erstelle ein neues Squash-Turnier</p>
        </div>
      </div>

      <Card className="shadow-card max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Turnier konfigurieren
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CreateTournamentForm />
        </CardContent>
      </Card>
    </Layout>
  );
};

export default NewTournament;
