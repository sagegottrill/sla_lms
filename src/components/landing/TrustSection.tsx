export default function TrustSection() {
  return (
    <div className="py-10 border-y border-border/30 bg-white">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6">
          <p className="text-sm font-semibold text-muted-foreground text-center">
            Powered by She Leads Africa
          </p>
          <div className="flex items-center justify-center opacity-70">
            <img
              src="/sla_logo_transparent.png"
              alt="She Leads Africa"
              className="h-8 sm:h-10 w-auto object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
