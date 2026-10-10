"""Etalonaje del edit: cálido, contraste alto, negros profundos, piel natural.

Trabaja en float32 RGB [0,1]. `grade(img, **p)` se usa en el render y en las pruebas.
"""
import numpy as np
import cv2

DEF = dict(negro=0.035, contraste=1.0, calor=1.0, sat=1.08, verdes=0.75, brillo=1.0)


def curva_s(x, k):
    """Curva en S suave con pivote en 0.45 (k = intensidad)."""
    p = 0.45
    y = np.where(x < p, p * (x / p) ** (1 + 0.55 * k), 1 - (1 - p) * ((1 - x) / (1 - p)) ** (1 + 0.45 * k))
    return y


def lum(x):
    return (0.2126 * x[..., 0] + 0.7152 * x[..., 1] + 0.0722 * x[..., 2])[..., None]


def grade(rgb, negro=0.035, contraste=1.0, calor=1.0, sat=1.08, verdes=0.75, brillo=1.0, piel_proteccion=0.8):
    orig = np.clip(rgb * brillo, 0, 1)
    x = orig
    # negros profundos: baja el punto negro
    x = np.clip((x - negro) / (1 - negro), 0, 1)
    # contraste en S
    x = curva_s(x, contraste)
    # calor: medios y altas hacia ámbar, sombras apenas hacia teal (piel protegida más abajo)
    L = lum(x)
    alto = np.clip((L - 0.25) / 0.6, 0, 1)
    bajo = 1 - np.clip(L / 0.3, 0, 1)
    x = x * (1 + calor * (alto * np.array([0.045, 0.012, -0.05]) + bajo * np.array([-0.02, 0.0, 0.025])))
    # saturación: más en general, menos en verdes (hojas y césped) y sin pasarse en piel
    hsv = cv2.cvtColor(np.clip(x, 0, 1).astype(np.float32), cv2.COLOR_RGB2HSV)
    h, s = hsv[..., 0], hsv[..., 1]
    verde = np.exp(-((h - 100) / 30) ** 2)          # h en grados: verdes ~70–130
    piel = np.exp(-((h - 20) / 14) ** 2) * (s > 0.15)
    f = sat * (1 - verde * (1 - verdes)) * (1 - 0.06 * sat * piel)
    hsv[..., 1] = np.clip(s * f, 0, 1)
    x = cv2.cvtColor(hsv, cv2.COLOR_HSV2RGB)
    # piel natural: en la piel se conserva el color original con la luminancia ya etalonada
    # (el contraste y el calor la llevaban a naranja: azul muy bajo)
    m = (piel * np.clip((lum(orig)[..., 0] - 0.12) / 0.2, 0, 1))[..., None] * piel_proteccion
    m = cv2.GaussianBlur(m[..., 0], (0, 0), 3)[..., None]
    natural = orig * (lum(x) / np.maximum(lum(orig), 1e-4)) * np.array([1.015, 1.0, 0.985])
    x = x * (1 - m) + natural * m
    return np.clip(x, 0, 1)
