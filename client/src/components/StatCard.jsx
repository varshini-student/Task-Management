import { Card, CardContent, Stack, Typography } from "@mui/material";

export default function StatCard({ label, value, hint, accent = "#4f46e5", icon: Icon, loading = false }) {
  return (
    <Card variant="outlined" sx={{ position: "relative", overflow: "hidden", transition: "transform .15s ease, box-shadow .15s ease", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(15, 23, 42, .08)" } }}>
      <span style={{ position: "absolute", inset: "0 auto 0 0", width: 4, background: accent }} />
      <CardContent sx={{ p: 2.25, "&:last-child": { pb: 2.25 } }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2}>
          <div><Typography variant="body2" color="text.secondary" fontWeight={600}>{label}</Typography><Typography sx={{ mt: .75, fontSize: 30, lineHeight: 1, fontWeight: 800 }}>{loading ? "-" : value}</Typography>{hint && <Typography sx={{ mt: .75, fontSize: 12 }} color="text.secondary">{hint}</Typography>}</div>
          {Icon && <Icon sx={{ color: accent, bgcolor: `${accent}18`, borderRadius: 2, p: .75, fontSize: 38 }} />}
        </Stack>
      </CardContent>
    </Card>
  );
}
