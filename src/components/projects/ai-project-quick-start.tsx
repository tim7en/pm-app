"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/hooks/use-translation"
import { 
  Brain, 
  Sparkles, 
  Clock,
  Users,
  Target,
  Calendar,
  CheckCircle2,
  ArrowRight,
  X,
  Lightbulb
} from "lucide-react"

interface AIProjectQuickStartProps {
  onStartAIWizard: () => void
  onClose: () => void
}

export function AIProjectQuickStart({ onStartAIWizard, onClose }: AIProjectQuickStartProps) {
  const { t } = useTranslation()
  const [currentTip, setCurrentTip] = useState(0)

  const quickStartTips = [
    {
      icon: <Brain className="w-5 h-5 text-blue-500" />,
      title: "Опишите ваш проект",
      description: "Детально опишите цели, требования и особенности вашего проекта",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: <Sparkles className="w-5 h-5 text-purple-500" />,
      title: "ИИ создаст план",
      description: "Наш ИИ проанализирует ваш проект и создаст оптимальный план выполнения",
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: <Target className="w-5 h-5 text-green-500" />,
      title: "Настройте задачи",
      description: "Просмотрите и настройте сгенерированные задачи под ваши потребности",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: <Calendar className="w-5 h-5 text-orange-500" />,
      title: "Автоматический календарь",
      description: "ИИ создаст календарные события для важных вех и встреч",
      color: "from-orange-500 to-red-600"
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-hidden bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="relative pb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
          
          <div className="text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.2 
              }}
              className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl"
            >
              <Brain className="w-8 h-8 text-white" />
            </motion.div>
            
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Быстрый старт с ИИ
            </CardTitle>
            <p className="text-muted-foreground">
              Создайте проект за 4 простых шага с помощью искусственного интеллекта
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {quickStartTips.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index <= currentTip 
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 scale-110" 
                    : "bg-gray-300 scale-90"
                }`}
              />
            ))}
          </div>

          {/* Current tip */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTip}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center space-y-4"
            >
              <div className={`w-20 h-20 bg-gradient-to-br ${quickStartTips[currentTip].color} rounded-full flex items-center justify-center mx-auto shadow-lg`}>
                {quickStartTips[currentTip].icon}
              </div>
              
              <h3 className="text-xl font-bold text-gray-800">
                {quickStartTips[currentTip].title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
                {quickStartTips[currentTip].description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Умная генерация задач</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Оптимизация временных рамок</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Интеграция календаря</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Назначения команды</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center gap-2">
              {currentTip > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentTip(Math.max(0, currentTip - 1))}
                >
                  Назад
                </Button>
              )}
              
              {currentTip < quickStartTips.length - 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentTip(Math.min(quickStartTips.length - 1, currentTip + 1))}
                >
                  Далее
                </Button>
              )}
            </div>

            <Button
              onClick={onStartAIWizard}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Начать создание
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Совет для лучших результатов:
                </p>
                <p className="text-sm text-blue-700">
                  Чем более детально вы опишете ваш проект, тем более точные и полезные задачи создаст ИИ.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
