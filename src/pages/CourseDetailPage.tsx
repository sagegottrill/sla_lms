import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import { Star, Clock, Users, Play, CheckCircle, ChevronDown, Globe, Award, BookOpen, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import type { Course } from "@/data/mockData";
import { useEnrollment } from "@/contexts/EnrollmentContext";

export default function CourseDetailPage() {
  const { id } = useParams();
  const { enroll, isEnrolled } = useEnrollment();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [openModule, setOpenModule] = useState<number | null>(0);

  useEffect(() => {
    api.getCourseById(Number(id)).then((data) => {
      setCourse(data ?? null);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/25 mb-6" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Course Not Found</h1>
          <p className="text-muted-foreground mb-6">The course you're looking for doesn't exist or has been removed.</p>
          <Link to="/courses">
            <Button className="gradient-card text-primary-foreground rounded-xl hover:opacity-90 gap-2">
              <ArrowLeft className="w-4 h-4" /> Browse Courses
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const enrolled = isEnrolled(course.id);

  const handleEnroll = () => {
    enroll(course.id, course.curriculum?.[0]?.items?.[0] ?? "Module 1");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-card border-b border-border px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link to="/courses" className="hover:text-primary">Courses</Link>
          <span>/</span>
          <span className="text-foreground truncate">{course.title}</span>
        </div>
      </div>

      {/* Hero */}
      <div className="gradient-hero">
        <div className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <span className="inline-block px-3 py-1 rounded-full bg-primary-foreground/10 text-primary-foreground text-xs font-semibold mb-4">{course.category}</span>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4 leading-tight">
              {course.title}
            </motion.h1>
            <p className="text-primary-foreground/70 text-lg mb-6">{course.subtitle}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-primary-foreground/70">
              <span className="flex items-center gap-1"><Star className="w-4 h-4 text-gold fill-gold" /> <strong className="text-primary-foreground">{course.rating}</strong> ({(course.reviewCount ?? 0).toLocaleString()} reviews)</span>
              <span className="flex items-center gap-1"><Users className="w-4 h-4" />{(course.students ?? 0).toLocaleString()} students</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{course.duration}</span>
              <span className="flex items-center gap-1"><Globe className="w-4 h-4" />{course.language}</span>
            </div>
            <p className="text-primary-foreground/70 text-sm mt-4">Created by <strong className="text-primary-foreground">{course.instructor}</strong> · Updated {course.lastUpdated}</p>
          </div>

          {/* Sticky card — desktop */}
          <div className="hidden lg:block">
            <div className="bg-card rounded-2xl shadow-brand-lg border border-border overflow-hidden sticky top-6">
              <img src={course.image} alt={course.title} className="w-full aspect-video object-cover" />
              <div className="p-6 space-y-4">
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold font-display text-foreground">{course.price === 0 ? "Free" : `₦${course.price?.toLocaleString()}`}</div>
                  {course.originalPrice && (
                    <div className="text-lg font-bold text-muted-foreground line-through">₦{course.originalPrice?.toLocaleString()}</div>
                  )}
                </div>
                {enrolled ? (
                  <Link to="/dashboard/courses" className="block">
                    <Button className="w-full gradient-card text-primary-foreground rounded-xl h-11 font-semibold shadow-brand-sm hover:opacity-90">Continue Learning</Button>
                  </Link>
                ) : course.price === 0 ? (
                  <Button onClick={handleEnroll} className="w-full gradient-card text-primary-foreground rounded-xl h-11 font-semibold shadow-brand-sm hover:opacity-90">Enrol for Free</Button>
                ) : (
                  <Link to={`/courses/${course.id}/checkout`} className="block">
                    <Button className="w-full gradient-card text-primary-foreground rounded-xl h-11 font-semibold shadow-brand-sm hover:opacity-90">Enrol Now — ₦{course.price?.toLocaleString()}</Button>
                  </Link>
                )}
                <div className="space-y-2 text-sm text-foreground pt-2 border-t border-border">
                  {[["Level", course.level], ["Duration", course.duration], ["Certificate", "Yes, upon completion"], ["Access", "Lifetime + mobile"]].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile enrol bar */}
      <div className="lg:hidden sticky top-0 z-20 bg-card border-b border-border p-4 flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-display text-foreground">{course.price === 0 ? "Free" : `₦${course.price?.toLocaleString()}`}</span>
          {course.originalPrice && (
            <span className="text-sm font-bold text-muted-foreground line-through">₦{course.originalPrice?.toLocaleString()}</span>
          )}
        </div>
        {enrolled ? (
          <Link to="/dashboard/courses">
            <Button className="gradient-card text-primary-foreground rounded-xl font-semibold px-6">Continue Learning</Button>
          </Link>
        ) : course.price === 0 ? (
          <Button onClick={handleEnroll} className="gradient-card text-primary-foreground rounded-xl font-semibold px-6">Enrol for Free</Button>
        ) : (
          <Link to={`/courses/${course.id}/checkout`}>
            <Button className="gradient-card text-primary-foreground rounded-xl font-semibold px-6">Enrol — ₦{course.price?.toLocaleString()}</Button>
          </Link>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* What you'll learn */}
          {course.whatYoullLearn?.length > 0 && (
            <section>
              <h2 className="font-display text-2xl font-bold text-foreground mb-5">What You'll Learn</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {course.whatYoullLearn.map((item) => (
                  <div key={item} className="flex gap-3 text-sm text-foreground">
                    <CheckCircle className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    {item}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Curriculum */}
          {course.curriculum?.length > 0 && (
            <section>
              <h2 className="font-display text-2xl font-bold text-foreground mb-5">Course Curriculum</h2>
              <div className="space-y-2">
                {course.curriculum.map((mod, i) => (
                  <div key={i} className="border border-border rounded-xl overflow-hidden">
                    <button onClick={() => setOpenModule(openModule === i ? null : i)}
                      className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors text-left">
                      <div>
                        <span className="text-sm font-semibold text-foreground">{mod.module}</span>
                        <span className="text-xs text-muted-foreground ml-3">{mod.lessons} lessons · {mod.duration}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openModule === i ? "rotate-180" : ""}`} />
                    </button>
                    {openModule === i && (
                      <div className="divide-y divide-border">
                        {mod.items.map((item, j) => (
                          <div key={j} className="px-4 py-3 flex items-center gap-3 text-sm text-muted-foreground hover:bg-muted/30">
                            <Play className="w-3.5 h-3.5 shrink-0 text-primary" />
                            {item}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Instructor */}
          {course.instructor && (
            <section>
              <h2 className="font-display text-2xl font-bold text-foreground mb-5">Your Instructor</h2>
              <div className="flex gap-4">
                {course.instructorAvatar && <img src={course.instructorAvatar} alt={course.instructor} className="w-16 h-16 rounded-2xl object-cover shrink-0" />}
                <div>
                  <h3 className="font-semibold text-foreground">{course.instructor}</h3>
                  <p className="text-sm text-secondary mb-2">{course.instructorTitle}</p>
                  <p className="text-sm text-muted-foreground">{course.instructorBio}</p>
                </div>
              </div>
            </section>
          )}

          {/* Reviews */}
          {course.reviews?.length > 0 && (
            <section>
              <h2 className="font-display text-2xl font-bold text-foreground mb-5">Student Reviews</h2>
              <div className="flex items-center gap-4 mb-6 p-5 bg-card border border-border rounded-2xl">
                <div className="text-center">
                  <div className="text-5xl font-bold font-display text-foreground">{course.rating}</div>
                  <div className="flex justify-center mt-1 gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 text-gold fill-gold" />)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Course Rating</div>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5, 4, 3, 2, 1].map(s => (
                    <div key={s} className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gold rounded-full" style={{ width: s === 5 ? "78%" : s === 4 ? "16%" : s === 3 ? "4%" : "1%" }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-3">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                {course.reviews.map((review, i) => (
                  <div key={i} className="p-4 bg-card rounded-2xl border border-border">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-full gradient-card flex items-center justify-center text-sm font-bold text-primary-foreground">{review.name.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{review.name}</p>
                        <div className="flex items-center gap-1">
                          {[...Array(review.rating)].map((_, j) => <Star key={j} className="w-3 h-3 text-gold fill-gold" />)}
                          <span className="text-xs text-muted-foreground ml-1">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
