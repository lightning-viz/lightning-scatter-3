from lightning import Lightning
from numpy import random, ceil, array

lgn = Lightning()

x = random.rand(100) 
y = random.rand(100)
z = random.rand(100)
group = (random.rand(100) * 5).astype('int')
size = random.rand(100) * 10 + 5

lgn.scatter3(x, y, z, group=group, size=size)