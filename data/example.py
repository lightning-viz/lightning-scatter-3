from lightning import Lightning
from numpy import random, ceil, array

lgn = Lightning()

x = random.randn(100) * 15
y = random.randn(100) * 15
z = random.randn(100) * 15

lgn.scatter3(x, y, z)