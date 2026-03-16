import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import { Star, Clock, Users, Play, CheckCircle, ChevronDown, Globe, BookOpen, ArrowLeft, Loader2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCourse, useUserEnrollments, useEnrollUserMutation } from "@/hooks/useQueries";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function CourseDetailPage() {
  const { id } = useParams();
  const courseIdNum = Number(id);
  
  const { appUser } = useAuth();
  
  // Enterprise State Management (Pillar 1): TanStack Query
  const { data: course, isLoading: loadingCourse } = useCourse(courseIdNum);
  const { data: enrollments = [], isLoading: loadingEnrollments } = useUserEnrollments(appUser?.id);
  const enrollMutation = useEnrollUserMutation();

  const [openModule, setOpenModule] = useState<number | null>(0);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const enrolled = enrollments.some((e: any) => e.course_id === courseIdNum);

  useEffect(() => {
    if (enrolled && !activeVideo && course?.curriculum?.length > 0) {
      const firstMod = course.curriculum[0];
      if (firstMod?.items?.length > 0) {
        const firstItem = firstMod.items[0];
        const url = typeof firstItem === "string" ? "" : (firstItem as any).vimeo_url;
        if (url) setActiveVideo(url);
      }
    }
  }, [enrolled, course, activeVideo]);

  if (loadingCourse || loadingEnrollments) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-12 w-3/4 rounded-lg" />
            <Skeleton className="h-6 w-1/2 rounded-lg" />
            <div className="flex gap-4 pt-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          <div className="hidden lg:block">
            <Skeleton className="w-full aspect-[4/5] rounded-2xl" />
          </div>
        </div>
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

  const handleEnroll = async () => {
    if (!appUser) {
      toast.error("Please log in to enrol.");
      return;
    }
    
    // Enterprise Optimistic UI
    toast.promise(
      enrollMutation.mutateAsync({ userId: appUser.id, courseId: course.id }),
      {
        loading: "Enrolling...",
        success: "Successfully enrolled in course!",
        error: "Failed to enrol. Please try again."
      }
    );
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("player.vimeo.com")) return url;
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? `https://player.vimeo.com/video/${match[1]}?title=0&byline=0&portrait=0` : url;
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

      {/* Hero / Player Area */}
      <div className="gradient-hero pb-8">
        <div className="max-w-7xl mx-auto px-6 pt-12 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col justify-center">
            {enrolled && activeVideo ? (
              <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-border/20 relative z-10 mb-6 group">
                <iframe
                  src={getEmbedUrl(activeVideo)}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : null}

            {!activeVideo && (
              <>
                <span className="inline-block px-3 py-1 rounded-full bg-primary-foreground/10 text-primary-foreground text-xs font-semibold mb-4 w-fit">{course.category}</span>
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
              </>
            )}

            {enrolled && activeVideo && (
               <div>
                  <h1 className="font-display text-2xl font-bold text-primary-foreground mb-2 leading-tight">
                    {course.title}
                  </h1>
                  <p className="text-primary-foreground/70 text-sm">Instructor: <strong className="text-primary-foreground">{course.instructor}</strong></p>
               </div>
            )}
          </div>

          {/* Sticky card — desktop */}
          <div className="hidden lg:block relative z-20">
            <div className={`bg-card rounded-2xl shadow-brand-lg border border-border overflow-hidden sticky ${enrolled && activeVideo ? "top-6" : "top-6"}`}>
              {!enrolled && <img src={course.image} alt={course.title} className="w-full aspect-video object-cover" />}
              <div className="p-6 space-y-4">
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold font-display text-foreground">{course.price === 0 ? "Free" : `₦${course.price?.toLocaleString()}`}</div>
                  {course.originalPrice && (
                    <div className="text-lg font-bold text-muted-foreground line-through">₦{course.originalPrice?.toLocaleString()}</div>
                  )}
                </div>
                {enrolled ? (
                  <Button disabled className="w-full bg-secondary text-primary rounded-xl h-11 font-semibold opacity-100 flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" /> Enrolled
                  </Button>
                ) : course.price === 0 ? (
                  <Button onClick={handleEnroll} disabled={enrollMutation.isPending} className="w-full gradient-card text-primary-foreground rounded-xl h-11 font-semibold shadow-brand-sm hover:opacity-90">
                    {enrollMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enrol for Free"}
                  </Button>
                ) : (
                  <Link to={`/courses/${course.id}/checkout`} className="block">
                    <Button className="w-full gradient-card text-primary-foreground rounded-xl h-11 font-semibold shadow-brand-sm hover:opacity-90">Enrol Now — ₦{course.price?.toLocaleString()}</Button>
                  </Link>
                )}
                
                {!enrolled && (
                  <div className="space-y-2 text-sm text-foreground pt-2 border-t border-border">
                    {[["Level", course.level], ["Duration", course.duration], ["Certificate", "Yes, upon completion"], ["Access", "Lifetime + mobile"]].map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                {enrolled && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-sm font-semibold text-foreground mb-2">Your Progress</p>
                      <div className="h-2 bg-muted rounded-full overflow-hidden w-full">
                         <div className="h-full bg-primary rounded-full transition-all" style={{ width: "15%" }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 text-right">15% completed</p>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile enrol bar */}
      {!enrolled && (
        <div className="lg:hidden sticky top-0 z-20 bg-card border-b border-border p-4 flex items-center justify-between gap-4">
            <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display text-foreground">{course.price === 0 ? "Free" : `₦${course.price?.toLocaleString()}`}</span>
            {course.originalPrice && (
                <span className="text-sm font-bold text-muted-foreground line-through">₦{course.originalPrice?.toLocaleString()}</span>
            )}
            </div>
            {course.price === 0 ? (
            <Button onClick={handleEnroll} disabled={enrollMutation.isPending} className="gradient-card text-primary-foreground rounded-xl font-semibold px-6">
                {enrollMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Enrol for Free"}
            </Button>
            ) : (
            <Link to={`/courses/${course.id}/checkout`}>
                <Button className="gradient-card text-primary-foreground rounded-xl font-semibold px-6">Enrol — ₦{course.price?.toLocaleString()}</Button>
            </Link>
            )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          
          {enrolled && activeVideo && course.whatYoullLearn?.length > 0 && (
             <section className="bg-card p-6 rounded-2xl border border-border">
                <h2 className="font-display text-lg font-bold text-foreground mb-3">Course Objectives</h2>
                <div className="grid sm:grid-cols-2 gap-2">
                    {course.whatYoullLearn.slice(0,4).map((item) => (
                    <div key={item} className="flex gap-2 text-xs text-muted-foreground">
                        <CheckCircle className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
                        {item}
                    </div>
                    ))}
                </div>
             </section>
          )}

          {!enrolled && course.whatYoullLearn?.length > 0 && (
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
                {course.curriculum.map((mod: any, i) => (
                  <div key={i} className="border border-border rounded-xl overflow-hidden bg-card">
                    <button onClick={() => setOpenModule(openModule === i ? null : i)}
                      className={`w-full flex items-center justify-between p-4 transition-colors text-left ${openModule === i ? "bg-accent/50" : "bg-muted/30 hover:bg-muted"}`}>
                      <div>
                        <span className="text-sm font-semibold text-foreground">{mod.module}</span>
                        <span className="text-xs text-muted-foreground ml-3 hidden sm:inline-block">{mod.lessons} lessons · {mod.duration}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openModule === i ? "rotate-180" : ""}`} />
                    </button>
                    {openModule === i && (
                      <div className="divide-y divide-border">
                        {mod.items.map((item: any, j: number) => {
                          const isObj = typeof item === 'object';
                          const title = isObj ? item.title : item;
                          const url = isObj ? item.vimeo_url : "";
                          // const type = isObj ? item.type : "video";
                          const duration = isObj ? item.duration : "";
                          const isActive = url && activeVideo === url;

                          return (
                            <button
                              key={j}
                              onClick={() => {
                                if (!enrolled) { toast.error("Please enrol to watch lessons."); return; }
                                if (url) setActiveVideo(url);
                                else toast.info("No video URL provided for this lesson.");
                              }}
                              className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 text-sm transition-colors ${isActive ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-muted/30 border-l-2 border-transparent"}`}
                            >
                              <div className="flex items-center gap-3">
                                {isActive ? (
                                    <Video className="w-4 h-4 shrink-0 text-primary" />
                                ) : (
                                    <Play className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                                )}
                                <span className={isActive ? "text-primary font-semibold" : "text-muted-foreground"}>
                                  {title}
                                </span>
                              </div>
                              {duration && <span className="text-xs text-muted-foreground shrink-0">{duration}</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Instructor */}
          {course.instructor && !activeVideo && (
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
          {course.reviews?.length > 0 && !activeVideo && (
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
                {course.reviews.map((review: any, i) => (
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
