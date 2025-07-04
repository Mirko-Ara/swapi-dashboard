import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, X } from "lucide-react";
import { useState, useEffect, type JSX } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLocation } from "@tanstack/react-router";

interface FunFact {
    id: number;
    titleKey: string;
    contentKey: string;
    icon: JSX.Element;
}

const initialFact: FunFact = {
    id: 0,
    titleKey: "",
    contentKey: "",
    icon: <Info className="w-6 h-6" />,
};

const DISPLAY_DURATION = 8000 as const;

const funFactsKeys: FunFact[] = [
    {
        id: 1,
        titleKey: "didYouKnow",
        contentKey: "fact1",
        icon: <Info className="w-6 h-6" />,
    },
    {
        id: 2,
        titleKey: "funFact",
        contentKey: "fact2",
        icon: <Info className="w-6 h-6" />,
    },
    {
        id: 3,
        titleKey: "starWarsTrivia",
        contentKey: "fact3",
        icon: <Info className="w-6 h-6" />,
    },
    {
        id: 4,
        titleKey: "galacticFun",
        contentKey: "fact4",
        icon: <Info className="w-6 h-6" />,
    },
    {
        id: 5,
        titleKey: "starshipFacts",
        contentKey: "fact5",
        icon: <Info className="w-6 h-6" />,
    },
    {
        id: 6,
        titleKey: "jediWisdom",
        contentKey: "fact6",
        icon: <Info className="w-6 h-6" />,
    },
    {
        id: 7,
        titleKey: "droidKnowledge",
        contentKey: "fact7",
        icon: <Info className="w-6 h-6" />,
    },
    {
        id: 8,
        titleKey: "sithSecrets",
        contentKey: "fact8",
        icon: <Info className="w-6 h-6" />,
    },
    {
        id: 9,
        titleKey: "cloneWars",
        contentKey: "fact9",
        icon: <Info className="w-6 h-6" />,
    },
    {
        id: 10,
        titleKey: "bountyHunterLore",
        contentKey: "fact10",
        icon: <Info className="w-6 h-6" />,
    },
    {
        id: 11,
        titleKey: "lightsaberLegends",
        contentKey: "fact11",
        icon: <Info className="w-6 h-6" />,
    },
    {
        id: 12,
        titleKey: "rebelAlliance",
        contentKey: "fact12",
        icon: <Info className="w-6 h-6" />,
    },
    {
        id: 13,
        titleKey: "theForce",
        contentKey: "fact13",
        icon: <Info className="w-6 h-6" />,
    },
    {
        id: 14,
        titleKey: "starWarsLegacy",
        contentKey: "fact14",
        icon: <Info className="w-6 h-6" />,
    },
    {
        id: 15,
        titleKey: "droidAdventures",
        contentKey: "fact15",
        icon: <Info className="w-6 h-6" />,
    },
    {
        id: 16,
        titleKey: "jediTraining",
        contentKey: "fact16",
        icon: <Info className="w-6 h-6" />,
    },
    {
        id: 17,
        titleKey: "sithHistory",
        contentKey: "fact17",
        icon: <Info className="w-6 h-6" />,
    },
    {
        id: 18,
        titleKey: "galacticPolitics",
        contentKey: "fact18",
        icon: <Info className="w-6 h-6" />,
    },
    {
        id: 19,
        titleKey: "starfighterBattles",
        contentKey: "fact19",
        icon: <Info className="w-6 h-6" />,
    },
    {
        id: 20,
        titleKey: "wookieeWarriors",
        contentKey: "fact20",
        icon: <Info className="w-6 h-6" />,
    },
];

export const FunFactWidget = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [currentFact, setCurrentFact] = useState<FunFact>(initialFact);
    const [progress, setProgress] = useState(0);
    const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
    const [isAppReady, setIsAppReady] = useState(false);
    const { t } = useTranslation();
    const location = useLocation();
    const [isEnabled] = useState(() => {
        if(typeof window !== "undefined") {
            return localStorage.getItem("funFactWidgetEnabled") !== "false";
        }
        return true;
    });

    const startTimer = () => {
        if (timerId) clearInterval(timerId);
        setProgress(0);

        const interval = setInterval(() => {
            setProgress((prev) => {
                const next = prev + 100 / (DISPLAY_DURATION / 100);
                if (next >= 100) {
                    clearInterval(interval);
                    setIsVisible(false);
                    return 100;
                }
                return next;
            });
        }, 100);

        setTimerId(interval);
    };

    const setRandomFact = () => {
        const randomIndex = Math.floor(Math.random() * funFactsKeys.length);
        setCurrentFact(funFactsKeys[randomIndex]);
    };

    const handleNewFact = () => {
        setRandomFact();
    };

    const handleClose = () => {
        setIsVisible(false);
        if (timerId) clearInterval(timerId);
        setTimeout(() => {
            setCurrentFact(initialFact);
            setProgress(0);
        }, 300);
    };

    useEffect(() => {
        if(location.pathname === "/login" || !isEnabled) {
            setIsVisible(false);
            return;
        }
        const timeout = setTimeout(() => {
            setIsAppReady(true);
        }, 2000);
        return () => clearTimeout(timeout);
    }, [isEnabled, location.pathname]);

    useEffect(() => {
        if(location.pathname === "/login" || !isEnabled) {
            setIsVisible(false);
            return;
        }
        if(isAppReady) {
            setRandomFact();
            setIsVisible(true);
        }
    }, [isAppReady, isEnabled, location.pathname]);

    useEffect(() => {
        if(location.pathname === "/login" || !isEnabled) {
            setIsVisible(false);
            return;
        }
       if(isAppReady) {
           setRandomFact();
           setIsVisible(true);
       }
    }, [location.pathname, isAppReady, isEnabled]);

    useEffect(() => {
        if (isVisible) {
            startTimer();
        }
    }, [currentFact, isVisible]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="fixed bottom-4 right-4 z-50"
                >
                    <Card className="w-80 shadow-lg transition-transform duration-200 ease-in-out">
                        <div className="w-full h-1 bg-gray-200 relative rounded-t-md overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.1, ease: "linear" }}
                                className="h-full bg-blue-500 absolute"
                            />
                        </div>

                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <CardTitle className="flex items-center gap-2">
                                    <Info className="h-5 w-5 text-blue-500" />
                                    <span>{currentFact.titleKey ? t(currentFact.titleKey) : ""}</span>
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleClose}
                                    className="h-8 w-8 cursor-pointer hover:text-destructive hover:scale-[0.99] hover:active-[0.99]"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <p className="mb-4">{currentFact.contentKey ? t(currentFact.contentKey) : ""}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNewFact}
                                className="w-full cursor-pointer hover:scale-[0.98] hover:active-[0.98]"
                            >
                                {t("anotherFact")}
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
};